from pathlib import Path

path = Path(r"C:\FieldShift\frontend\src\main.jsx")
content = path.read_text(encoding="utf-8")

# 1. Add state variables inside App()
state_needle = "  const [selectedMatrixStrategy, setSelectedMatrixStrategy] = useState(null);"
state_replacement = """  const [selectedMatrixStrategy, setSelectedMatrixStrategy] = useState(null);
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [provenanceExpanded, setProvenanceExpanded] = useState(false);"""

if state_needle in content:
    content = content.replace(state_needle, state_replacement)
    print("State variables added!")
else:
    old_crlf = state_needle.replace("\n", "\r\n")
    new_crlf = state_replacement.replace("\n", "\r\n")
    if old_crlf in content:
        content = content.replace(old_crlf, new_crlf)
        print("State variables added with CRLF!")
    else:
        print("State needle not found!")

# 2. Add handleRunBenchmark function
func_needle = "  async function handleApplyStrategy(strategyName) {"
func_addition = """  async function handleRunBenchmark(scenarioId) {
    setBenchmarkLoading(true);
    setSelectedBenchmarkId(scenarioId);
    try {
      const res = await request('/api/scenarios/benchmark/run', {
        method: 'POST',
        body: JSON.stringify({ scenario_id: scenarioId })
      });
      setBenchmarkResult(res);
      setSelectedMatrixStrategy('profit_focused');
    } catch (err) {
      console.error('Failed to run benchmark scenario:', err);
    } finally {
      setBenchmarkLoading(false);
    }
  }

  async function handleApplyStrategy(strategyName) {"""

if func_needle in content:
    content = content.replace(func_needle, func_addition)
    print("handleRunBenchmark function added!")
else:
    old_crlf = func_needle.replace("\n", "\r\n")
    new_crlf = func_addition.replace("\n", "\r\n")
    if old_crlf in content:
        content = content.replace(old_crlf, new_crlf)
        print("handleRunBenchmark function added with CRLF!")
    else:
        print("func needle not found!")

path.write_text(content, encoding="utf-8")
