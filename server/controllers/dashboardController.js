
import pool from "../config/db.js";

export const getMonthlyUsage = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        "Month" AS month,
        "Period_Start" AS period_start,
        "Period_End" AS period_end,
        "No_of_Days" AS no_of_days,
        "Previous_kWh" AS previous_kwh,
        "Current_kWh" AS current_kwh,
        "Total_kWh" AS total_kwh,
        "Rate_per_kWh" AS rate_per_kwh,
        "Expense" AS expense,
        "Status" AS status
      FROM public.electricity_usage_data
      ORDER BY "Period_Start" ASC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch electricity data."
    });
  }
};

export const getKPI = async (req, res) => {
  try {
    const { month } = req.query;

    const result = await pool.query(
      `
      SELECT
        "Month" AS month,
        "Period_Start" AS period_start,
        "Total_kWh" AS total_kwh,
        "Expense" AS expense,
        "No_of_Days" AS no_of_days,
        "Status" AS status
      FROM public.electricity_usage_data
      WHERE "Month" = $1
      `,
      [month]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No data found."
      });
    }

    const data = result.rows[0];

    const previousResult = await pool.query(
      `
      SELECT "Total_kWh" AS total_kwh
      FROM public.electricity_usage_data
      WHERE "Period_End" < $1
      ORDER BY "Period_End" DESC
      LIMIT 1
      `,
      [data.period_start]
    );

    let changePercent = 0;

    if (previousResult.rows.length > 0) {
      const previous = Number(previousResult.rows[0].total_kwh);
      const current = Number(data.total_kwh);

      if (previous !== 0) {
        changePercent = ((current - previous) / previous) * 100;
      }
    }

    res.status(200).json({
      month: data.month,
      total_kwh: data.total_kwh,
      expense: data.expense,
      no_of_days: data.no_of_days,
      average_daily_usage:
        Number(data.total_kwh) / Number(data.no_of_days),
      status: data.status,
      change_percent: changePercent.toFixed(2)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch KPI data."
    });
  }
};

export const getTrends = async (req, res) => {
  try {
    const { year } = req.query;
    const selectedYear = parseInt(year, 10);

    if (!Number.isInteger(selectedYear)) {
      return res.status(400).json({
        message: "A valid year is required."
      });
    }

    let startDate;
    let endDate;

    if (selectedYear === 2026) {
      startDate = "2025-08-01";
      endDate = "2026-08-31";
    } else {
      startDate = `${selectedYear}-01-01`;
      endDate = `${selectedYear}-12-31`;
    }

    const result = await pool.query(
      `
      SELECT
        "Month" AS month,
        "Period_Start" AS period_start,
        "Period_End" AS period_end,
        "Total_kWh" AS total_kwh,
        "Expense" AS expense,
        "Status" AS status
      FROM public.electricity_usage_data
      WHERE "Period_Start" >= $1
        AND "Period_Start" <= $2
      ORDER BY "Period_Start" ASC
      `,
      [startDate, endDate]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch trend data."
    });
  }
};

export const getFloorComparison = async (req, res) => {
  try {
    const { month } = req.query;

    const result = await pool.query(
      `
      SELECT
        "Month" AS month,
        "First_Floor" AS first_floor,
        "Second_Floor" AS second_floor,
        "Total_kWh" AS total_kwh
      FROM public.floor_usage_data
      WHERE "Month" = $1
      `,
      [month]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No floor data found."
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch floor comparison."
    });
  }
};

export const getMeterComparison = async (req, res) => {
  try {
    const { year } = req.query;

    const result = await pool.query(
      `
      SELECT
        "Month" AS month,
        "Previous_kWh" AS previous_kwh,
        "Current_kWh" AS current_kwh
      FROM public.electricity_usage_data
      WHERE EXTRACT(YEAR FROM "Period_Start") = $1
      ORDER BY "Period_Start" ASC
      `,
      [year]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch meter comparison."
    });
  }
};
