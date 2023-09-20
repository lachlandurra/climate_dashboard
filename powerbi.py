import pandas as pd
import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('C:\\Users\\durrl1\\climate_dashboard\\instance\\climatedashboard.db')


# Extract data from each table into DataFrames
df_period = pd.read_sql_query("SELECT * FROM reporting_period", conn)
df_business_or_facility = pd.read_sql_query("SELECT * FROM business_or_facility", conn)
df_report = pd.read_sql_query("SELECT * FROM emission_report", conn)

# Join the tables
# First join: EmissionReport with ReportingPeriod
df_merged1 = pd.merge(df_report, df_period, how='left', left_on='reporting_period_id', right_on='id', suffixes=('', '_period'))

# Second join: The result from the first join with BusinessOrFacility
df_final = pd.merge(df_merged1, df_business_or_facility, how='left', left_on='business_or_facility_id', right_on='id', suffixes=('', '_business_or_facility'))

# Close the connection
conn.close()

# Print the consolidated DataFrame for Power BI to capture
print(df_final.to_string())
