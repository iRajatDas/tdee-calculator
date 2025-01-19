"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import Link from "next/link";

const POUNDS_TO_KILOGRAMS = 0.453592;
const INCHES_TO_CENTIMETERS = 2.54;

// Constants for Mifflin-St Jeor formula
const WEIGHT_MULTIPLIER = 10;
const HEIGHT_MULTIPLIER = 6.25;
const AGE_MULTIPLIER = 5;
const MALE_CONSTANT = 5;
const FEMALE_CONSTANT = -161;

type ChartData = {
  labels: string[];
  datasets: Dataset[];
};

type Dataset = {
  data: number[];
  backgroundColor: string[];
  borderColor: string;
  borderRadius: number;
  maxBarThickness: number;
};

// Register Chart.js components so react-chartjs-2 works
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TdeeFormSchema = z.object({
  unitSystem: z.enum(["metric", "imperial"]),
  age: z.coerce
    .number({
      message: "Please enter a valid age",
    })
    .min(15, { message: "Age must be at least 15" })
    .max(80, { message: "Age must be at most 80" }),
  gender: z.enum(["male", "female"]),
  weight: z.coerce
    .number({
      message: "Please enter a valid weight",
    })
    .positive("Weight must be > 0"),
  height: z.coerce
    .number({
      message: "Please enter a valid height",
    })
    .positive("Height must be > 0"),
  activityLevel: z.enum(["1.2", "1.375", "1.55", "1.725", "1.9"]),
});

type TdeeFormData = z.infer<typeof TdeeFormSchema>;

export default function TdeeCalculatorPage() {
  // Hook Form setup with Zod
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<TdeeFormData>({
    resolver: zodResolver(TdeeFormSchema),
    defaultValues: {
      unitSystem: "metric",
      age: undefined,
      gender: "male",
      weight: undefined,
      height: undefined,
      activityLevel: "1.2",
    },
  });

  // Computed results
  const [bmr, setBmr] = useState<number | null>(null);
  const [tdee, setTdee] = useState<number | null>(null);
  const [targets, setTargets] = useState<{
    moderateLoss: number;
    mildLoss: number;
    maintenance: number;
    mildGain: number;
    moderateGain: number;
  } | null>(null);

  // Chart data config
  const [chartData, setChartData] = useState<ChartData | null>(null);

  // Macro tab state
  const [macroTab, setMacroTab] = useState<"moderate" | "low" | "high">(
    "moderate"
  );
  // Macro results
  const [macroProtein, setMacroProtein] = useState(0);
  const [macroFats, setMacroFats] = useState(0);
  const [macroCarbs, setMacroCarbs] = useState(0);

  const onSubmit = (formData: TdeeFormData) => {
    const { unitSystem, age, gender } = formData;
    let { weight, height } = formData;
    const activityLevel = parseFloat(formData.activityLevel);

    // Convert Imperial to Metric if needed
    if (unitSystem === "imperial") {
      weight = weight * POUNDS_TO_KILOGRAMS; // lbs -> kg
      height = height * INCHES_TO_CENTIMETERS; // in  -> cm
    }

    // Mifflin-St Jeor BMR Calculation
    let bmrCalc: number;
    if (gender === "male") {
      bmrCalc =
        WEIGHT_MULTIPLIER * weight +
        HEIGHT_MULTIPLIER * height -
        AGE_MULTIPLIER * age +
        MALE_CONSTANT;
    } else {
      bmrCalc =
        WEIGHT_MULTIPLIER * weight +
        HEIGHT_MULTIPLIER * height -
        AGE_MULTIPLIER * age +
        FEMALE_CONSTANT;
    }

    const tdeeCalc = Math.round(bmrCalc * activityLevel);

    // Different calorie targets
    const c = {
      moderateLoss: Math.round(tdeeCalc - 500),
      mildLoss: Math.round(tdeeCalc - 250),
      maintenance: tdeeCalc,
      mildGain: Math.round(tdeeCalc + 250),
      moderateGain: Math.round(tdeeCalc + 500),
    };

    setBmr(Math.round(bmrCalc));
    setTdee(tdeeCalc);
    setTargets(c);
  };

  useEffect(() => {
    if (!targets || !tdee) return;

    // Rebuild chart data
    setChartData({
      labels: [
        "Moderate Loss",
        "Mild Loss",
        "Maintenance",
        "Mild Gain",
        "Mod. Gain",
      ],
      datasets: [
        {
          data: [
            targets.moderateLoss,
            targets.mildLoss,
            targets.maintenance,
            targets.mildGain,
            targets.moderateGain,
          ],
          backgroundColor: [
            "#60a5fa",
            "#93c5fd",
            "#0f62fe",
            "#93c5fd",
            "#60a5fa",
          ],
          borderColor: "transparent",
          borderRadius: 6,
          maxBarThickness: 60,
        },
      ],
    });

    // Re-calc macros based on macroTab
    function calcMacros(ratio: "moderate" | "low" | "high") {
      const cal = tdee || 0;
      switch (ratio) {
        case "moderate":
          // 30% protein, 35% fat, 35% carbs
          return {
            protein: Math.round((cal * 0.3) / 4),
            fats: Math.round((cal * 0.35) / 9),
            carbs: Math.round((cal * 0.35) / 4),
          };
        case "low":
          // 40% protein, 40% fat, 20% carbs
          return {
            protein: Math.round((cal * 0.4) / 4),
            fats: Math.round((cal * 0.4) / 9),
            carbs: Math.round((cal * 0.2) / 4),
          };
        case "high":
          // 30% protein, 20% fat, 50% carbs
          return {
            protein: Math.round((cal * 0.3) / 4),
            fats: Math.round((cal * 0.2) / 9),
            carbs: Math.round((cal * 0.5) / 4),
          };
      }
    }

    const macros = calcMacros(macroTab);
    if (macros) {
      setMacroProtein(macros.protein);
      setMacroFats(macros.fats);
      setMacroCarbs(macros.carbs);
    }
  }, [targets, tdee, macroTab]);

  /* ------------------------------------------------------------------
   * Reset logic
   * ------------------------------------------------------------------ */
  const handleReset = () => {
    reset();
    setBmr(null);
    setTdee(null);
    setTargets(null);
    setChartData(null);
    setMacroProtein(0);
    setMacroFats(0);
    setMacroCarbs(0);
  };

  /* ------------------------------------------------------------------
   * Render
   * ------------------------------------------------------------------ */
  return (
    <>
      <div className="app-container">
        {/* --- Main Layout --- */}
        <div className="main-layout">
          <div className="calculator-wrapper">
            {/* --- Calculator Form (React Hook Form) --- */}
            <div className="calculator">
              <form
                // Instead of onSubmit, we do handleSubmit from RHF
                onSubmit={handleSubmit(onSubmit)}
                className="form-layout"
              >
                {/* Unit Toggle */}
                <div className="input-group full-width">
                  <label>Units</label>
                  <div className="unit-toggle">
                    <input
                      type="radio"
                      id="metric"
                      value="metric"
                      // Use register from react-hook-form
                      {...register("unitSystem")}
                    />
                    <label htmlFor="metric">Metric</label>

                    <input
                      type="radio"
                      id="imperial"
                      value="imperial"
                      {...register("unitSystem")}
                    />
                    <label htmlFor="imperial">Imperial</label>
                  </div>
                  {errors.unitSystem && (
                    <span style={{ color: "red" }}>
                      {errors.unitSystem.message}
                    </span>
                  )}
                </div>

                {/* Age */}
                <div className="input-group">
                  <label htmlFor="age">Age</label>
                  <input
                    type="number"
                    id="age"
                    placeholder="Years"
                    {...register("age", { valueAsNumber: true })}
                  />
                  {errors.age && (
                    <span style={{ color: "red" }}>{errors.age.message}</span>
                  )}
                </div>

                {/* Gender */}
                <div className="input-group">
                  <label htmlFor="gender">Gender</label>
                  <select id="gender" {...register("gender")}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  {errors.gender && (
                    <span style={{ color: "red" }}>
                      {errors.gender.message}
                    </span>
                  )}
                </div>

                {/* Weight */}
                <div className="input-group">
                  <label>
                    Weight ({watch("unitSystem") === "metric" ? "kg" : "lbs"})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder={
                      watch("unitSystem") === "metric" ? "kg" : "lbs"
                    }
                    {...register("weight", { valueAsNumber: true })}
                  />
                  {errors.weight && (
                    <span style={{ color: "red" }}>
                      {errors.weight.message}
                    </span>
                  )}
                </div>

                {/* Height */}
                <div className="input-group">
                  <label>
                    Height ({watch("unitSystem") === "metric" ? "cm" : "inches"}
                    )
                  </label>
                  <input
                    type="number"
                    placeholder={
                      watch("unitSystem") === "metric" ? "cm" : "inches"
                    }
                    {...register("height", { valueAsNumber: true })}
                  />
                  {errors.height && (
                    <span style={{ color: "red" }}>
                      {errors.height.message}
                    </span>
                  )}
                </div>

                {/* Activity Level */}
                <div className="input-group full-width">
                  <label>Activity Level</label>
                  <select {...register("activityLevel")}>
                    <option value="1.2">Sedentary (office job)</option>
                    <option value="1.375">
                      Light Exercise (1-3 days/week)
                    </option>
                    <option value="1.55">
                      Moderate Exercise (3-5 days/week)
                    </option>
                    <option value="1.725">
                      Heavy Exercise (6-7 days/week)
                    </option>
                    <option value="1.9">Athlete (2x training per day)</option>
                  </select>
                  {errors.activityLevel && (
                    <span style={{ color: "red" }}>
                      {errors.activityLevel.message}
                    </span>
                  )}
                </div>

                {/* Buttons */}
                <div className="input-group full-width">
                  <div className="button-group">
                    <button type="submit" className="primary-button">
                      Calculate TDEE
                    </button>
                    <button
                      type="button"
                      className="reset-button"
                      onClick={handleReset}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* --- Results Section --- */}
            {tdee && targets && (
              <div id="resultsSection" className="results">
                <div className="results-header">
                  <h2
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      marginBottom: "0.5rem",
                    }}
                  >
                    Your Daily Calorie Needs
                  </h2>
                  <p style={{ fontSize: "0.875rem", opacity: 0.9 }}>
                    Based on your metrics and activity level
                  </p>
                </div>

                <div className="results-content">
                  <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--text-light)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Your Maintenance Calories
                    </div>
                    <div
                      style={{
                        fontSize: "2.5rem",
                        fontWeight: 800,
                        color: "var(--primary)",
                        lineHeight: 1.2,
                      }}
                    >
                      {tdee.toLocaleString()} calories/day
                    </div>
                    <div
                      style={{
                        fontSize: "1.125rem",
                        color: "var(--text-light)",
                        marginTop: "0.5rem",
                      }}
                    >
                      {(tdee * 7).toLocaleString()} calories/week
                    </div>
                  </div>

                  {/* BMR + Activity breakdown */}
                  <div
                    style={{
                      background: "var(--bg)",
                      padding: "1.5rem",
                      borderRadius: "8px",
                      marginBottom: "2rem",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: 600,
                        marginBottom: "1rem",
                      }}
                    >
                      Calorie Breakdown by Activity Level
                    </h3>
                    <div style={{ display: "grid", gap: "0.75rem" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Basal Metabolic Rate (BMR)</span>
                        <span>{bmr?.toLocaleString()} calories/day</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Sedentary</span>
                        <span>
                          {Math.round((bmr || 0) * 1.2).toLocaleString()}{" "}
                          calories/day
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Light Exercise</span>
                        <span>
                          {Math.round((bmr || 0) * 1.375).toLocaleString()}{" "}
                          calories/day
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Moderate Exercise</span>
                        <span>
                          {Math.round((bmr || 0) * 1.55).toLocaleString()}{" "}
                          calories/day
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Heavy Exercise</span>
                        <span>
                          {Math.round((bmr || 0) * 1.725).toLocaleString()}{" "}
                          calories/day
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Athlete</span>
                        <span>
                          {Math.round((bmr || 0) * 1.9).toLocaleString()}{" "}
                          calories/day
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Weight Loss / Gain Cards */}
                  <div className="result-grid">
                    <div className="result-card">
                      <div className="result-label">Weight Loss</div>
                      <div className="result-value">
                        <div
                          style={{
                            fontSize: "0.875rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Moderate (0.5 kg/week) {/* or 1 lb/week if needed */}
                        </div>
                        <div>{targets.moderateLoss.toLocaleString()} cal</div>
                      </div>
                    </div>

                    <div className="result-card">
                      <div className="result-label">Mild Weight Loss</div>
                      <div className="result-value">
                        <div
                          style={{
                            fontSize: "0.875rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Mild (0.25 kg/week)
                        </div>
                        <div>{targets.mildLoss.toLocaleString()} cal</div>
                      </div>
                    </div>

                    <div className="result-card">
                      <div className="result-label">Mild Weight Gain</div>
                      <div className="result-value">
                        <div
                          style={{
                            fontSize: "0.875rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Mild (0.25 kg/week)
                        </div>
                        <div>{targets.mildGain.toLocaleString()} cal</div>
                      </div>
                    </div>

                    <div className="result-card">
                      <div className="result-label">Weight Gain</div>
                      <div className="result-value">
                        <div
                          style={{
                            fontSize: "0.875rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Moderate (0.5 kg/week)
                        </div>
                        <div>{targets.moderateGain.toLocaleString()} cal</div>
                      </div>
                    </div>
                  </div>

                  {/* Macronutrients */}
                  <div
                    style={{
                      marginTop: "2rem",
                      background: "var(--bg)",
                      padding: "1.5rem",
                      borderRadius: "8px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: 600,
                        marginBottom: "1rem",
                      }}
                    >
                      Recommended Macronutrients
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "0.5rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <button
                        className={`macro-tab ${
                          macroTab === "moderate" ? "active" : ""
                        }`}
                        onClick={() => setMacroTab("moderate")}
                        type="button"
                      >
                        Moderate Carb
                      </button>
                      <button
                        className={`macro-tab ${
                          macroTab === "low" ? "active" : ""
                        }`}
                        onClick={() => setMacroTab("low")}
                        type="button"
                      >
                        Lower Carb
                      </button>
                      <button
                        className={`macro-tab ${
                          macroTab === "high" ? "active" : ""
                        }`}
                        onClick={() => setMacroTab("high")}
                        type="button"
                      >
                        Higher Carb
                      </button>
                    </div>
                    <div
                      id="macroResults"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "1rem",
                        textAlign: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "1.25rem" }}>
                          {macroProtein}g
                        </div>
                        <div style={{ color: "var(--text-light)" }}>
                          Protein
                        </div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "1.25rem" }}>
                          {macroFats}g
                        </div>
                        <div style={{ color: "var(--text-light)" }}>Fats</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "1.25rem" }}>
                          {macroCarbs}g
                        </div>
                        <div style={{ color: "var(--text-light)" }}>Carbs</div>
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div style={{ marginTop: "2rem", height: 300 }}>
                    {chartData && (
                      <Bar
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: false,
                              grid: { color: "rgba(0,0,0,0.05)" },
                            },
                            x: {
                              grid: { display: false },
                            },
                          },
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              callbacks: {
                                label: (ctx) => {
                                  return `${ctx.parsed.y.toLocaleString()} calories`;
                                },
                              },
                            },
                          },
                        }}
                      />
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: "2rem",
                      padding: "1rem",
                      background: "var(--bg)",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      color: "var(--text-light)",
                    }}
                  >
                    <strong>Note:</strong> These calculations provide estimates
                    based on validated formulas. Individual results may vary.
                    Consult with a healthcare professional for personalized
                    advice.
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside>{/* Additional side content could go here */}</aside>
        </div>
      </div>

      {/* Info Section */}
      <div className="app-container">
        <div className="main-layout">
          <div className="info-section">
            <h2>What is TDEE?</h2>
            <p>
              TDEE stands for Total Daily Energy Expenditure. It is an estimate
              of the total number of calories your body burns in a day,
              including the calories you burn through physical activity and
              exercise, as well as the calories your body needs to maintain
              basic functions like breathing, digestion, and circulation.
            </p>
            <p>
              Knowing your TDEE can be helpful for various purposes, such as:
            </p>
            <ul className="info-list">
              <li>
                <strong>Weight Management:</strong> If you want to maintain,
                lose, or gain weight, understanding your TDEE can help you
                determine the appropriate calorie intake for your goals.
              </li>
              <li>
                <strong>Meal Planning:</strong> Knowing your daily calorie needs
                can guide you in creating a balanced meal plan that meets your
                energy requirements.
              </li>
              <li>
                <strong>Fitness Goals:</strong> TDEE can help you optimize your
                nutrition and training to support your fitness goals, whether
                you&apos;re looking to build muscle, improve endurance, or
                enhance overall performance.
              </li>
            </ul>
            <p>
              Our
              <Link href="/">TDEE Calculator</Link> provides a personalized
              estimate of your daily calorie needs based on your age, gender,
              weight, height, and activity level. While these calculations are
              based on proven formulas, remember that individual results may
              vary, and it&apos;s always recommended to consult with healthcare
              professionals for personalized advice.
            </p>
            <p>
              If you are in UK, you can use our VAT Calculator to calculate your
              VAT.
            </p>
            <div
              style={{
                background: "var(--bg)",
                padding: "1.25rem",
                borderRadius: "8px",
                marginTop: "1.5rem",
              }}
            >
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  marginBottom: "0.75rem",
                  color: "var(--text)",
                }}
              >
                How TDEE is Calculated
              </h3>
              <p style={{ marginBottom: 0, fontSize: "0.875rem" }}>
                We use the Mifflin-St Jeor equation to calculate your Basal
                Metabolic Rate (BMR), then multiply it by an activity factor to
                determine your TDEE. This method is widely recognized for its
                accuracy in estimating daily calorie needs.
              </p>
            </div>
          </div>

          <aside></aside>
        </div>
      </div>
    </>
  );
}
