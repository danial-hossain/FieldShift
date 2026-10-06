from pathlib import Path

server_path = Path("app/server.py")
server_code = server_path.read_text(encoding="utf-8")

# Add to GET routes
get_crop_marker = """            if path == "/api/crops":
                from src.data.crops import load_crop_knowledge

                self._send_json(
                    *_json_response(
                        {
                            "status": "ok",
                            "crops": load_crop_knowledge().to_dict(orient="records"),
                        }
                    )
                )
                return"""

get_crop_enhanced = """            if path == "/api/crops":
                from src.data.crops import load_crop_knowledge

                self._send_json(
                    *_json_response(
                        {
                            "status": "ok",
                            "crops": load_crop_knowledge().to_dict(orient="records"),
                        }
                    )
                )
                return
            if path == "/api/scenarios/benchmarks":
                from src.scenarios.benchmark_scenarios import get_benchmark_scenario_list
                self._send_json(
                    *_json_response(
                        {
                            "status": "ok",
                            "scenarios": get_benchmark_scenario_list(),
                        }
                    )
                )
                return"""

assert get_crop_marker in server_code or get_crop_marker.replace("\n", "\r\n") in server_code
server_code = server_code.replace(get_crop_marker, get_crop_enhanced).replace(get_crop_marker.replace("\n", "\r\n"), get_crop_enhanced)

# Add to POST routes
post_weather_marker = """        if parsed.path == "/api/location/weather":"""
post_benchmark_section = """        if parsed.path == "/api/scenarios/benchmark/run":
            from src.scenarios.benchmark_scenarios import run_benchmark_scenario, run_all_benchmark_scenarios
            body = _read_body(self)
            scenario_id = body.get("scenario_id")
            try:
                if not scenario_id or str(scenario_id).lower() == "all":
                    res = {"status": "ok", "results": run_all_benchmark_scenarios()}
                else:
                    res = {"status": "ok", "result": run_benchmark_scenario(str(scenario_id).upper())}
                self._send_json(*_json_response(res))
            except Exception as error:
                self._send_api_error(400, str(error))
            return
        if parsed.path == "/api/location/weather":"""

assert post_weather_marker in server_code or post_weather_marker.replace("\n", "\r\n") in server_code
server_code = server_code.replace(post_weather_marker, post_benchmark_section).replace(post_weather_marker.replace("\n", "\r\n"), post_benchmark_section)

server_path.write_text(server_code, encoding="utf-8")
print("Successfully added benchmark endpoints to app/server.py!")
