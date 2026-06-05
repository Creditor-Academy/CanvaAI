import React from "react";

const CHART_TYPES = [
  { id: "bar", label: "Bar Chart" },
  { id: "line", label: "Line Graph" },
  { id: "pie", label: "Pie Chart" },
];

const ChartPropertiesSection = ({
  layer,
  updateChartLayer,
  saveToHistory,
  PaletteColorControl,
  styles,
}) => {
  const series = Array.isArray(layer.series) ? layer.series : [];
  const colors = Array.isArray(layer.colors) ? layer.colors : [];

  const commitSeries = (nextSeries, save = true) => {
    updateChartLayer(layer.id, { series: nextSeries }, save);
  };

  const updateSeriesField = (index, field, rawValue, save = false) => {
    const next = series.map((item, i) => {
      if (i !== index) return item;
      if (field === "value") {
        const num = Number(rawValue);
        return { ...item, value: Number.isFinite(num) ? Math.max(0, num) : 0 };
      }
      return { ...item, [field]: rawValue };
    });
    commitSeries(next, save);
  };

  const updateSeriesColor = (index, color, save = false) => {
    const nextColors = [...colors];
    while (nextColors.length < series.length) {
      nextColors.push("#2563eb");
    }
    nextColors[index] = color;
    updateChartLayer(layer.id, { colors: nextColors }, save);
  };

  const addSeriesRow = () => {
    saveToHistory();
    const next = [
      ...series,
      { label: `Item ${series.length + 1}`, value: 25 },
    ];
    const nextColors = [...colors, "#2563eb"];
    updateChartLayer(layer.id, { series: next, colors: nextColors }, false);
  };

  const removeSeriesRow = (index) => {
    if (series.length <= 1) return;
    saveToHistory();
    const next = series.filter((_, i) => i !== index);
    const nextColors = colors.filter((_, i) => i !== index);
    updateChartLayer(layer.id, { series: next, colors: nextColors }, false);
  };

  return (
    <>
      <h3 style={styles.heading}>Chart</h3>

      <div className="tool-section">
        <div className="tool-title">Chart Type</div>
        <select
          value={layer.chartType || "bar"}
          onChange={(e) => {
            saveToHistory();
            updateChartLayer(layer.id, { chartType: e.target.value }, false);
          }}
        >
          {CHART_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="tool-section chart-data-section">
        <div className="tool-title chart-data-header">
          <span>Data Points</span>
          <button type="button" className="chart-add-row-btn" onClick={addSeriesRow}>
            + Add
          </button>
        </div>

        <div className="chart-data-rows">
          {series.map((item, index) => (
            <div key={`chart-row-${index}`} className="chart-data-row">
              <input
                type="color"
                className="chart-series-color"
                value={colors[index] || "#2563eb"}
                onChange={(e) => updateSeriesColor(index, e.target.value, false)}
                onBlur={() => saveToHistory()}
                title="Series color"
              />
              <input
                type="text"
                className="chart-label-input"
                placeholder="Label"
                value={item.label || ""}
                onChange={(e) => updateSeriesField(index, "label", e.target.value, false)}
                onBlur={() => saveToHistory()}
              />
              <input
                type="number"
                className="chart-value-input"
                min={0}
                placeholder="Value"
                value={item.value ?? 0}
                onChange={(e) => updateSeriesField(index, "value", e.target.value, false)}
                onBlur={() => saveToHistory()}
              />
              <button
                type="button"
                className="chart-remove-row-btn"
                disabled={series.length <= 1}
                onClick={() => removeSeriesRow(index)}
                title="Remove row"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <PaletteColorControl
        label="Label Color"
        value={layer.textColor || "#334155"}
        onHistorySave={saveToHistory}
        onColorChange={(color, save) =>
          updateChartLayer(layer.id, { textColor: color }, save)
        }
      />

      {layer.chartType !== "pie" && (
        <PaletteColorControl
          label="Grid Color"
          value={layer.gridColor || "#cbd5e1"}
          onHistorySave={saveToHistory}
          onColorChange={(color, save) =>
            updateChartLayer(layer.id, { gridColor: color }, save)
          }
        />
      )}

      <PaletteColorControl
        label="Background"
        value={
          !layer.backgroundColor || layer.backgroundColor === "transparent"
            ? "#ffffff"
            : layer.backgroundColor
        }
        onHistorySave={saveToHistory}
        onColorChange={(color, save) =>
          updateChartLayer(layer.id, { backgroundColor: color }, save)
        }
      />

      <div className="tool-section">
        <div className="tool-title">Corner Radius</div>
        <div className="inline-input">
          <span>Radius</span>
          <input
            type="number"
            min={0}
            max={40}
            value={layer.borderRadius ?? 8}
            onChange={(e) =>
              updateChartLayer(
                layer.id,
                {
                  borderRadius: Math.min(40, Math.max(0, Number(e.target.value))),
                },
                false
              )
            }
            onBlur={() => saveToHistory()}
          />
        </div>
      </div>
    </>
  );
};

export default ChartPropertiesSection;
