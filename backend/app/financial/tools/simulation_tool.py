from __future__ import annotations

from typing import Any

from app.financial.engines.simulation_engine import SimulationEngine
from app.financial.schemas import ScenarioInput


async def run_simulation(scenario: dict[str, Any], context: dict[str, Any]) -> dict:
    """Run a what-if scenario and return a serialisable result."""
    scenario_input = ScenarioInput(**scenario)
    result = SimulationEngine.run(scenario_input, context)
    return result.model_dump()
