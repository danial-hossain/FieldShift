import unittest
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app import main
from backend.app.database import Base
from backend.app.models import Analysis, Farm, User


class AnalysisAutoApprovalTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        self.session_factory = sessionmaker(bind=self.engine, autoflush=False)
        Base.metadata.create_all(self.engine)
        with self.session_factory() as db:
            self.user = User(
                name="Analysis tester",
                email="analysis-tester@example.com",
                password_hash="unused",
                is_active=True,
                created_at=main.now(),
                updated_at=main.now(),
            )
            db.add(self.user)
            db.commit()
            db.refresh(self.user)
            self.user_id = self.user.id

        def override_db():
            with self.session_factory() as db:
                yield db

        def override_user():
            return self.user

        self.original_overrides = dict(main.app.dependency_overrides)
        main.app.dependency_overrides[main.get_db] = override_db
        main.app.dependency_overrides[main.require_user] = override_user
        self.client = TestClient(main.app)

    def tearDown(self):
        main.app.dependency_overrides.clear()
        main.app.dependency_overrides.update(self.original_overrides)
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def test_analysis_submission_runs_and_persists_result(self):
        result = {"status": "ok", "recommendation": "balanced"}
        with patch("backend.app.main.workflow_result", return_value=result) as workflow:
            response = self.client.post(
                "/api/analyses",
                json={"priority": "balanced", "season": "aman"},
            )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["status"], "created")
        self.assertEqual(body["analysis"]["status"], "completed")
        self.assertEqual(body["summary"], result)
        self.assertEqual(body["analysis"]["summary_json"]["result"], result)
        workflow.assert_called_once()

        with self.session_factory() as db:
            analysis = db.scalar(select(Analysis))
            self.assertEqual(analysis.status, "completed")
            self.assertIsNotNone(analysis.started_at)
            self.assertIsNotNone(analysis.completed_at)

    def test_failed_automatic_run_is_persisted(self):
        with patch(
            "backend.app.main.workflow_result",
            side_effect=HTTPException(502, "workflow unavailable"),
        ):
            response = self.client.post("/api/analyses", json={"priority": "balanced"})

        self.assertEqual(response.status_code, 502)
        history = self.client.get("/api/analyses").json()["analyses"]
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0]["status"], "failed")
        self.assertEqual(history[0]["error_message"], "workflow unavailable")
        self.assertIsNotNone(history[0]["completed_at"])

    def test_analysis_submission_rejects_another_users_farm(self):
        with self.session_factory() as db:
            other_user = User(
                name="Other user",
                email="other-analysis-user@example.com",
                password_hash="unused",
                is_active=True,
                created_at=main.now(),
                updated_at=main.now(),
            )
            db.add(other_user)
            db.flush()
            farm = Farm(
                user_id=other_user.id,
                name="Other farm",
                created_at=main.now(),
                updated_at=main.now(),
            )
            db.add(farm)
            db.commit()
            farm_id = farm.id

        with patch("backend.app.main.workflow_result") as workflow:
            response = self.client.post("/api/analyses", json={"farm_id": farm_id})

        self.assertEqual(response.status_code, 404)
        workflow.assert_not_called()
        with self.session_factory() as db:
            self.assertIsNone(db.scalar(select(Analysis)))

    def test_manual_run_endpoint_remains_available_for_reruns(self):
        with patch(
            "backend.app.main.workflow_result",
            side_effect=[
                {"status": "ok", "run": 1},
                {"status": "ok", "run": 2},
            ],
        ) as workflow:
            created = self.client.post("/api/analyses", json={"priority": "balanced"})
            analysis_id = created.json()["analysis"]["id"]
            rerun = self.client.post(f"/api/analyses/{analysis_id}/run", json={})

        self.assertEqual(created.status_code, 201)
        self.assertEqual(rerun.status_code, 200)
        self.assertEqual(rerun.json()["analysis"]["status"], "completed")
        self.assertEqual(rerun.json()["summary"]["run"], 2)
        self.assertEqual(workflow.call_count, 2)

    def test_analysis_endpoints_still_require_authentication(self):
        main.app.dependency_overrides.pop(main.require_user)
        with patch("backend.app.main.workflow_result") as workflow:
            response = self.client.post("/api/analyses", json={"priority": "balanced"})

        self.assertEqual(response.status_code, 401)
        workflow.assert_not_called()


if __name__ == "__main__":
    unittest.main()
