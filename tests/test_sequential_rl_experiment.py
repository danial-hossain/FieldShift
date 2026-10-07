import pytest

from src.data.crops import load_crop_knowledge
from src.rl.crop_rotation_rl import SEQUENTIAL_RL_CROPS, run_sequential_policy_step
from backend.app.main import (
    Payload,
    apply_rl_intervention,
    rl_baseline_execute,
    rl_decision,
    rl_execute,
    rl_intervene,
    rl_reoptimize,
    rl_weights,
    run_milp_baseline_step_payload,
    run_rl_step_payload,
)


WEIGHTS = {"profit": 0.34, "water": 0.33, "soil": 0.33}


def initial_state():
    return {
        "season_id": "Y1_S1",
        "temperature_c": 25.0,
        "available_water_mm": 1200.0,
        "soil_moisture": 0.28,
        "soil_health_score": 60.0,
        "soil_ph": 6.5,
        "previous_crop": "Maize",
        "previous_crop_family": "Poaceae",
        "seasons_since_legume": 1,
    }


def test_sequential_decision_uses_the_supplied_updated_state():
    crops = load_crop_knowledge()
    state_s0 = initial_state()
    season_one = run_sequential_policy_step(
        state_s0,
        crops,
        weights=WEIGHTS,
        season_index=0,
        field_area_ha=5.0,
    )
    state_s1 = dict(season_one["state_after_crop"])
    state_s1["available_water_mm"] = 180.0
    state_s1["temperature_c"] = 31.0
    season_two = run_sequential_policy_step(
        state_s1,
        crops,
        weights=WEIGHTS,
        season_index=1,
        field_area_ha=5.0,
    )

    assert season_one["season_index"] == 0
    assert season_two["season_index"] == 1
    assert season_two["candidate_actions"] != season_one["candidate_actions"]
    assert season_two["rl_proposed_action"] != season_one["rl_proposed_action"]
    assert season_two["state_after_crop"]["previous_crop"] == season_two["applied_action"]
    assert season_two["outcome"]["production_tons"] == (
        season_two["outcome"]["expected_yield_t_ha"] * 5.0
    )


def test_manual_crop_override_is_distinguished_and_drives_transition():
    crops = load_crop_knowledge()
    state = initial_state()
    policy_step = run_sequential_policy_step(
        state,
        crops,
        weights=WEIGHTS,
        season_index=0,
        field_area_ha=5.0,
    )
    alternate_crop = next(
        item["crop"]
        for item in policy_step["candidate_actions"]
        if item["crop"] != policy_step["rl_proposed_action"]
    )
    overridden = run_sequential_policy_step(
        state,
        crops,
        weights=WEIGHTS,
        season_index=0,
        field_area_ha=5.0,
        applied_crop=alternate_crop,
    )

    assert overridden["rl_proposed_action"] == policy_step["rl_proposed_action"]
    assert overridden["applied_action"] == alternate_crop
    assert overridden["decision_source"] == "user_override"
    assert overridden["outcome"]["crop"] == alternate_crop
    assert overridden["state_after_crop"]["previous_crop"] == alternate_crop


def test_infeasible_manual_override_remains_marked_infeasible_for_counterfactual_run():
    state = {**initial_state(), "available_water_mm": 1.0}
    result = run_sequential_policy_step(
        state,
        load_crop_knowledge(),
        weights=WEIGHTS,
        season_index=0,
        field_area_ha=5.0,
        applied_crop="Sesame",
    )
    sesame = next(action for action in result["candidate_actions"] if action["crop"] == "Sesame")

    assert result["rl_proposed_action"] != "Sesame"
    assert result["applied_action"] == "Sesame"
    assert result["decision_source"] == "user_override"
    assert sesame["is_feasible"] is False
    assert result["outcome"]["crop"] == "Sesame"
    assert result["state_after_crop"]["available_water_mm"] == 0.0
    assert result["state_after_crop"]["available_water_source"] == "simulation-derived crop-season water transition"
    assert result["state_after_crop"]["soil_health_score_source"] == "simulation-derived soil-health proxy transition"


def test_missing_state_is_not_silently_defaulted():
    state = initial_state()
    state["available_water_mm"] = None

    try:
        run_sequential_policy_step(
            state,
            load_crop_knowledge(),
            weights=WEIGHTS,
            season_index=0,
            field_area_ha=5.0,
        )
    except ValueError as error:
        assert "available_water_mm" in str(error)
    else:
        raise AssertionError("Missing water must stop the RL decision instead of defaulting.")


def test_unknown_legume_history_stays_unknown_until_a_legume_action():
    state = initial_state()
    state["seasons_since_legume"] = None
    crops = load_crop_knowledge()

    non_legume = run_sequential_policy_step(
        state,
        crops,
        weights=WEIGHTS,
        season_index=0,
        field_area_ha=5.0,
        applied_crop="Sesame",
    )
    legume = run_sequential_policy_step(
        state,
        crops,
        weights=WEIGHTS,
        season_index=0,
        field_area_ha=5.0,
        applied_crop="Chickpea",
    )

    assert non_legume["state_after_crop"]["seasons_since_legume"] is None
    assert legume["state_after_crop"]["seasons_since_legume"] == 0


def test_backend_intervention_updates_the_completed_state_before_next_decision():
    state = initial_state()
    updated, intervention = apply_rl_intervention(
        state,
        {"water_reduction_pct": 0.2, "temperature_delta_c": 3},
    )

    assert updated["available_water_mm"] == 960.0
    assert updated["temperature_c"] == 28.0
    assert intervention["water_reduction_pct"] == 0.2
    assert intervention["temperature_delta_c"] == 3.0
    assert updated["available_water_source"] == "simulation-derived from crop transition and user-selected water stress"
    assert updated["temperature_source"] == "simulation-derived from prior temperature and user-selected heat stress"


def test_supported_water_and_heat_stresses_are_independent_and_normal_is_unchanged():
    state = initial_state()
    water_stress, _ = apply_rl_intervention(state, {"water_reduction_pct": 0.4})
    heat_stress, _ = apply_rl_intervention(state, {"temperature_delta_c": 3})
    severe_stress, severe_applied = apply_rl_intervention(
        state,
        {"water_reduction_pct": 0.6, "temperature_delta_c": 1},
    )
    normal, intervention = apply_rl_intervention(state, {})

    assert water_stress["available_water_mm"] == 720.0
    assert water_stress["temperature_c"] == state["temperature_c"]
    assert heat_stress["available_water_mm"] == state["available_water_mm"]
    assert heat_stress["temperature_c"] == state["temperature_c"] + 3
    assert severe_stress["available_water_mm"] == 480.0
    assert severe_stress["temperature_c"] == state["temperature_c"] + 1
    assert severe_applied["water_reduction_pct"] == 0.6
    assert severe_applied["temperature_delta_c"] == 1.0
    assert normal["available_water_mm"] == state["available_water_mm"]
    assert normal["temperature_c"] == state["temperature_c"]
    assert intervention == {
        "water_reduction_pct": 0.0,
        "temperature_delta_c": 0.0,
        "available_water_override_mm": None,
        "temperature_override_c": None,
    }

    for invalid in (
        {"water_reduction_pct": 0.8},
        {"temperature_delta_c": 2},
    ):
        try:
            apply_rl_intervention(state, invalid)
        except Exception as error:
            assert getattr(error, "status_code", None) == 422
        else:
            raise AssertionError("Unsupported stress choices must remain rejected.")


def test_rl_decision_rejects_invalid_initial_simulation_inputs():
    common = {
        "field_id": "demo",
        "strategy_id": "balanced",
        "field_area_ha": 5.0,
        "completed_seasons": [],
        "milp_reference_rotation": ["Chickpea", "Sesame", "Chickpea", "Sesame", "Chickpea", "Sesame"],
    }
    invalid_initial_state = {**initial_state(), "soil_ph": 15.0}

    try:
        rl_decision(
            Payload.model_validate({
                **common,
                "state": invalid_initial_state,
                "initial_state": invalid_initial_state,
                "season_index": 1,
            }),
            fieldshift_session=None,
            db=None,
        )
    except Exception as error:
        assert getattr(error, "status_code", None) == 422
        assert "outside the supported" in str(error.detail)
    else:
        raise AssertionError("Unsupported initial pH must be rejected by the backend.")


def test_api_flow_generates_next_action_from_intervened_state():
    state_s1 = initial_state()
    common = {
        "field_id": "demo",
        "strategy_id": "balanced",
        "field_area_ha": 5.0,
        "initial_state": initial_state(),
        "completed_seasons": [],
        "milp_reference_rotation": ["Chickpea", "Sesame", "Chickpea", "Sesame", "Chickpea", "Sesame"],
    }
    season_one = rl_baseline_execute(
        Payload.model_validate({**common, "state": state_s1, "season_index": 0}),
        fieldshift_session=None,
        db=None,
    )["season"]
    assert season_one["applied_action"] == common["milp_reference_rotation"][0]
    assert season_one["rl_proposed_action"] is None
    assert season_one["candidate_actions"] == []
    assert season_one["decision_source"] == "milp_baseline"
    assert season_one["state_after"] is None
    assert season_one["intervention"] is None
    updated = rl_intervene(
        Payload.model_validate({
            "field_id": "demo",
            "season_index": 0,
            "state": season_one["state_after_crop"],
            "intervention": {"water_reduction_pct": 0.4, "temperature_delta_c": 5},
        }),
        fieldshift_session=None,
        db=None,
    )["state_after"]
    first_history_record = {
        "season_id": "Y1_S1",
        "state_before": state_s1,
        "milp_reference_crop": common["milp_reference_rotation"][0],
        "rl_proposed_action": None,
        "applied_action": season_one["applied_action"],
        "decision_source": "milp_baseline",
        "outcome": season_one["outcome"],
        "stress_intervention": {
            "water_reduction_pct": 0.4,
            "temperature_delta_c": 5.0,
            "available_water_override_mm": None,
            "temperature_override_c": None,
        },
        "state_after_crop": season_one["state_after_crop"],
        "state_after": updated,
        "status": "completed",
    }
    decision_two = rl_decision(
        Payload.model_validate({
            **common,
            "state": updated,
            "season_index": 1,
            "completed_seasons": [first_history_record],
        }),
        fieldshift_session=None,
        db=None,
    )["decision"]

    assert season_one["status"] == "completed"
    assert updated["available_water_mm"] < season_one["state_after_crop"]["available_water_mm"]
    assert updated["temperature_c"] == season_one["state_after_crop"]["temperature_c"] + 5
    assert decision_two["decision_reason"]["state_used"]["available_water_mm"] == updated["available_water_mm"]
    assert decision_two["decision_reason"]["state_used"]["temperature_c"] == updated["temperature_c"]
    assert decision_two["experiment_context"]["completed_season_count"] == 1
    assert decision_two["experiment_context"]["prior_applied_crops"] == [season_one["applied_action"]]
    assert decision_two["season_number"] == 2


def test_rl_endpoints_reject_s1_policy_decisions():
    state = initial_state()
    body = {
        "field_id": "demo",
        "strategy_id": "balanced",
        "field_area_ha": 5.0,
        "state": state,
        "initial_state": state,
        "season_index": 0,
        "completed_seasons": [],
        "milp_reference_rotation": ["Chickpea", "Sesame", "Chickpea", "Sesame", "Chickpea", "Sesame"],
    }
    for endpoint in (rl_decision, rl_execute):
        try:
            endpoint(Payload.model_validate(body), fieldshift_session=None, db=None)
        except Exception as error:
            assert getattr(error, "status_code", None) == 422
            assert "S1" in str(error.detail)
        else:
            raise AssertionError("S1 must not be generated or executed as an RL decision.")

    try:
        rl_decision(
            Payload.model_validate({
                **body,
                "season_index": 1,
                "state": {**state, "season_id": "Y1_S2"},
                "completed_seasons": [],
            }),
            fieldshift_session=None,
            db=None,
        )
    except Exception as error:
        assert getattr(error, "status_code", None) == 422
        assert "exactly the prior completed seasons" in str(error.detail)
    else:
        raise AssertionError("S2 must require the completed S1 baseline history.")


def test_three_season_api_flow_preserves_state_history_and_per_season_interventions():
    state = {**initial_state(), "field_area_ha": 5.0}
    common = {
        "field_id": "demo",
        "strategy_id": "balanced",
        "field_area_ha": 5.0,
        "initial_state": state,
        "completed_seasons": [],
        "milp_reference_rotation": ["Chickpea", "Sesame", "Chickpea", "Sesame", "Chickpea", "Sesame"],
    }
    history = []
    interventions = [
        {"water_reduction_pct": 0.2, "temperature_delta_c": 0},
        {"water_reduction_pct": 0, "temperature_delta_c": 5},
        {},
    ]

    for index in range(3):
        if index == 0:
            executed = rl_baseline_execute(
                Payload.model_validate({**common, "state": state, "season_index": 0}),
                fieldshift_session=None,
                db=None,
            )["season"]
            assert executed["applied_action"] == common["milp_reference_rotation"][0]
            assert executed["rl_proposed_action"] is None
            assert executed["decision_source"] == "milp_baseline"
        else:
            decision = rl_decision(
                Payload.model_validate({
                    **common,
                    "state": state,
                    "season_index": index,
                    "completed_seasons": history,
                }),
                fieldshift_session=None,
                db=None,
            )["decision"]
            assert decision["season_number"] == index + 1
            assert decision["current_state"] == state
            assert len(decision["experiment_context"]["prior_outcomes"]) == index
            assert len(decision["experiment_context"]["prior_interventions"]) == index
            chosen_override = next(
                action["crop"]
                for action in decision["candidate_actions"]
                if action["crop"] != decision["rl_proposed_action"]
            ) if index == 1 else None
            executed = rl_execute(
                Payload.model_validate({
                    **common,
                    "state": state,
                    "season_index": index,
                    "completed_seasons": history,
                    "applied_crop": chosen_override,
                    "expected_proposed_action": decision["rl_proposed_action"],
                }),
                fieldshift_session=None,
                db=None,
            )["season"]
            if index == 1:
                assert executed["decision_source"] == "user_override"
                assert executed["rl_proposed_action"] != executed["applied_action"]

        assert executed["state_after"] is None
        assert executed["outcome"]["crop"] == executed["applied_action"]

        transitioned = rl_intervene(
            Payload.model_validate({
                "field_id": "demo",
                "season_index": index,
                "state": executed["state_after_crop"],
                "intervention": interventions[index],
            }),
            fieldshift_session=None,
            db=None,
        )
        next_state = transitioned["state_after"]
        assert next_state["season_id"] == (
            ["Y1_S2", "Y2_S1", "Y2_S2"][index]
        )
        assert transitioned["intervention"]["water_reduction_pct"] == interventions[index].get("water_reduction_pct", 0)
        assert transitioned["intervention"]["temperature_delta_c"] == interventions[index].get("temperature_delta_c", 0)
        if index == 0:
            assert next_state["available_water_mm"] < executed["state_after_crop"]["available_water_mm"]
            assert next_state["available_water_source"] == "simulation-derived from crop transition and user-selected water stress"
        if index == 1:
            assert next_state["temperature_c"] == executed["state_after_crop"]["temperature_c"] + 5
            assert next_state["temperature_source"] == "simulation-derived from prior temperature and user-selected heat stress"

        history.append({
            "season_id": executed["season_id"],
            "state_before": state,
            "milp_reference_crop": common["milp_reference_rotation"][index],
            "rl_proposed_action": executed["rl_proposed_action"],
            "applied_action": executed["applied_action"],
            "decision_source": executed["decision_source"],
            "outcome": executed["outcome"],
            "stress_intervention": transitioned["intervention"],
            "state_after_crop": executed["state_after_crop"],
            "state_after": next_state,
            "status": "completed",
        })
        state = next_state

    assert len(history) == 3
    assert history[1]["state_before"] == history[0]["state_after"]
    assert history[2]["state_before"] == history[1]["state_after"]
    assert history[2]["stress_intervention"]["water_reduction_pct"] == 0
    assert history[2]["stress_intervention"]["temperature_delta_c"] == 0


def test_backend_decision_endpoint_payload_uses_canonical_strategy_weights():
    result = run_rl_step_payload({
        "state": initial_state(),
        "season_index": 0,
        "field_area_ha": 5.0,
        "strategy_id": "balanced",
    })

    assert result["status"] == "completed"
    assert len(result["candidate_actions"]) == 8
    assert result["rl_proposed_action"] == result["candidate_actions"][0]["crop"]
    assert rl_weights("water_efficiency") == {"profit": 0.2, "water": 0.6, "soil": 0.2}
    assert result["reward_configuration"]["strategy_weights"] == WEIGHTS


def test_milp_baseline_can_simulate_a_crop_outside_the_rl_action_set():
    crop_names = load_crop_knowledge()["crop"].tolist()
    baseline_crop = next(crop for crop in crop_names if crop not in SEQUENTIAL_RL_CROPS)
    result = run_milp_baseline_step_payload({
        "state": initial_state(),
        "season_index": 0,
        "field_area_ha": 5.0,
        "strategy_id": "balanced",
    }, baseline_crop)

    assert result["applied_action"] == baseline_crop
    assert result["rl_proposed_action"] is None
    assert result["decision_source"] == "milp_baseline"
    assert result["candidate_actions"] == []
    assert result["outcome"]["crop"] == baseline_crop


def completed_trajectory(initial, strategy_id, field_area_ha):
    season_ids = ["Y1_S1", "Y1_S2", "Y2_S1", "Y2_S2", "Y3_S1", "Y3_S2"]
    trajectory = []
    state = {**initial, "field_area_ha": field_area_ha}
    for index, season_id in enumerate(season_ids):
        if index == 0:
            season = run_milp_baseline_step_payload({
                "state": state,
                "season_index": index,
                "strategy_id": strategy_id,
                "field_area_ha": state["field_area_ha"],
            }, "Chickpea")
        else:
            season = run_rl_step_payload({
                "state": state,
                "season_index": index,
                "strategy_id": strategy_id,
                "field_area_ha": state["field_area_ha"],
            })
        state_after_crop = season["state_after_crop"]
        state_after_crop["season_id"] = season_ids[index + 1] if index < 5 else None
        intervention, applied_intervention = apply_rl_intervention(
            state_after_crop,
            {
                "water_reduction_pct": 0,
                "temperature_delta_c": 0,
                "available_water_override_mm": 800,
                "temperature_override_c": 33,
            },
        )
        intervention["season_id"] = season_ids[index + 1] if index < 5 else None
        trajectory.append({
            "season_id": season_id,
            "state_before": state,
            "milp_reference_crop": "Chickpea" if index == 0 else (
                "Sesame" if index % 2 == 1 else "Chickpea"
            ),
            "rl_proposed_action": season["rl_proposed_action"],
            "applied_action": season["applied_action"],
            "decision_source": season["decision_source"],
            "outcome": season["outcome"],
            "stress_intervention": applied_intervention,
            "state_after_crop": state_after_crop,
            "state_after": intervention,
            "status": "completed",
        })
        if index == 0:
            assert trajectory[-1]["decision_source"] == "milp_baseline"
            assert trajectory[-1]["rl_proposed_action"] is None
            assert trajectory[-1]["applied_action"] == trajectory[-1]["milp_reference_crop"]
        else:
            assert trajectory[-1]["decision_source"] in {"rl_policy", "user_override"}
            assert trajectory[-1]["rl_proposed_action"] is not None
            assert trajectory[-1]["state_before"] == trajectory[-2]["state_after"]
        state = intervention
    return trajectory


def test_synthetic_benchmark_reoptimization_uses_final_experiment_state():
    trajectory = completed_trajectory({
        "season_id": "Y1_S1",
        "temperature_c": 30.0,
        "available_water_mm": 320.0,
        "soil_health_score": 52.5,
        "soil_ph": 6.8,
        "previous_crop": None,
        "previous_crop_family": None,
        "seasons_since_legume": 1,
    }, "water_efficiency", 2.0)
    response = rl_reoptimize(
        Payload.model_validate({
            "field_id": "demo",
            "strategy_id": "water_efficiency",
            "benchmark_id": "B",
            "final_state": trajectory[-1]["state_after"],
            "rl_trajectory": trajectory,
        }),
        fieldshift_session=None,
        db=None,
    )

    assert response["status"] == "ok"
    assert response["benchmark"]["scenario"]["temperature_c"] == 33.0
    assert response["benchmark"]["inputs"]["available_water_mm"] == 800.0
    assert response["benchmark"]["scenario"]["previous_crop"] == trajectory[-1]["applied_action"]
    assert response["benchmark"]["inputs"]["soil_moisture"] is None
    assert len(response["rl_trajectory"]) == 6
    strategy_metrics = response["benchmark"]["strategy_metrics"]["water_focused"]
    assert strategy_metrics["total_harvest_tons"] is not None
    assert strategy_metrics["total_water_requirement_mm"] is not None
    production_rows = strategy_metrics["seasonal_production_breakdown"]
    assert len(production_rows) == 6
    assert len({row["period"] for row in production_rows}) == 6
    assert sum(row["production_tons"] for row in production_rows) == pytest.approx(
        strategy_metrics["total_harvest_tons"], abs=0.01
    )
    for row in production_rows:
        assert row["production_tons"] == pytest.approx(
            row["yield_t_ha"] * row["field_area_ha"], abs=0.001
        )
    assert response["summary"]["planning"]["selected_strategy_result"] == response["benchmark"]["strategies"]["water_focused"]
