
import pandas as pd

from database import get_database_engine


def load_monthly_data():
    engine = get_database_engine()

    query = """
        SELECT
            f."Month",
            e."Period_Start",
            f."First_Floor",
            f."Second_Floor",
            f."Total_kWh"
        FROM public.floor_usage_data f
        INNER JOIN public.electricity_usage_data e
            ON f."Month" = e."Month"
        WHERE e."Status" = 'Actual'
        ORDER BY e."Period_Start";
    """

    df = pd.read_sql(query, engine)

    engine.dispose()

    return df


def prepare_data():
    df = load_monthly_data()

    # Convert the date column to datetime
    df["Period_Start"] = pd.to_datetime(df["Period_Start"])

    # Sort records chronologically
    df = df.sort_values("Period_Start").reset_index(drop=True)

    # Create time-based features
    df["Year"] = df["Period_Start"].dt.year
    df["Month_Number"] = df["Period_Start"].dt.month

    # Verify the monthly data
    print("\nMonthly Dataset Preview:")
    print(df.head())

    print("\nDataset Information:")
    print(f"Total actual months: {len(df)}")
    print(f"First month: {df['Month'].iloc[0]}")
    print(f"Last month: {df['Month'].iloc[-1]}")

    print("\nMissing Values:")
    print(df.isnull().sum())

    return df


if __name__ == "__main__":
    monthly_data = prepare_data()
