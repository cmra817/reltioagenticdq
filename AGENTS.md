# Project architecture decisions

- `AddDatasetModal` owns the shared three-step data-asset workflow and supports fullscreen or app-shell presentation, so regular and agentic entry points cannot drift.
- `SetupSessionProvider` (add-dataset-agentic/setup-sessions) owns in-progress agentic setups in localStorage and their open/close state, so navigating away never loses a plan.