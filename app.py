from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate  

# Move the app creation into a factory function.
db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///climatedashboard.db'

    print("Database URI:", app.config['SQLALCHEMY_DATABASE_URI'])  # Add this line for debugging
    app.secret_key = 'your_secret_key_here'

    db.init_app(app)
    migrate.init_app(app, db)

    from models import User, ReportingPeriod, EmissionReport, BusinessOrFacility

    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/create_reporting_period', methods=['GET', 'POST'])
    def create_reporting_period():
        # this creates a new reporting period, where the user can enter the start and end month and year
        if request.method == 'POST':
            start_month = request.form['start_month']
            start_year = request.form['start_year']
            end_month = request.form['end_month']
            end_year = request.form['end_year']
            reporting_period = ReportingPeriod(start_month=start_month, start_year=start_year, end_month=end_month, end_year=end_year)
            db.session.add(reporting_period)
            db.session.commit()
            return redirect(url_for('index'))
        return render_template('create_reporting_period.html')

    @app.route('/api/all_reporting_periods', methods=['GET'])
    def all_reporting_periods():
        periods = ReportingPeriod.query.all()
        return jsonify([{
            'id': period.id,
            'start_month': period.start_month,
            'start_year': period.start_year,
            'end_month': period.end_month,
            'end_year': period.end_year
        } for period in periods])
    
    @app.route('/api/emissions_over_time', methods=['GET'])
    def get_emissions_over_time():
        periods = ReportingPeriod.query.all()
        data = []
        for period in periods:
            solar_emissions = sum([report.co2_emissions_solar for report in period.reports])
            other_emissions = sum([report.other_emissions for report in period.reports])
            data.append({
                "end_month": period.end_month, 
                "end_year": period.end_year,   
                "solar_emissions": solar_emissions,
                "other_emissions": other_emissions
            })
        return jsonify(data)

    @app.route('/remove_reporting_period', methods=['GET', 'POST'])
    def remove_reporting_period():
        if request.method == 'POST':
            period_id = request.form.get('reporting_period_id')
            period = ReportingPeriod.query.get(period_id)
            
            if period:
                db.session.delete(period)
                db.session.commit()
                return redirect(url_for('index'))
            else:
                return "Error: Reporting Period Not Found", 400

        # If GET request, display the page with all reporting periods
        periods = ReportingPeriod.query.all()
        return render_template('remove_reporting_period.html', periods=periods)

    @app.route('/view_reports', methods=['GET', 'POST'])
    def view_reports():
        reporting_periods = ReportingPeriod.query.all()

        if not reporting_periods:  # Check if there are no reporting periods
            return render_template('view_reports.html', reporting_periods=[], reports=[])

        if request.method == 'POST':
            reporting_period_id = request.form['reporting_period']
        else:  # If method is GET, default to the first reporting period
            reporting_period_id = reporting_periods[0].id

        selected_reporting_period = ReportingPeriod.query.get(reporting_period_id)
        reports = selected_reporting_period.reports

        # Calculations
        total_ghg_savings = sum([report.total_emissions for report in reports])
        total_solar_savings = sum([report.co2_emissions_solar for report in reports])
        total_cost_savings = sum([report.cost_savings for report in reports])
        local_business_count = sum([1 for report in reports if report.type.title() == "Local Business"])
        council_facility_count = sum([1 for report in reports if report.type.title() == "Council Facility"])

        # For Council Facilities
        cf_total_ghg_savings = sum([report.total_emissions for report in reports if report.type.title() == "Council Facility"])
        cf_total_solar_savings = sum([report.co2_emissions_solar for report in reports if report.type.title() == "Council Facility"])
        cf_total_cost_savings = sum([report.cost_savings for report in reports if report.type.title() == "Council Facility"])

        # For Local Businesses
        lb_total_ghg_savings = sum([report.total_emissions for report in reports if report.type.title() == "Local Business"])
        lb_total_solar_savings = sum([report.co2_emissions_solar for report in reports if report.type.title() == "Local Business"])
        lb_total_cost_savings = sum([report.cost_savings for report in reports if report.type.title() == "Local Business"])

        return render_template('view_reports.html', reporting_periods=reporting_periods, reports=reports, 
                                selected_period=reporting_period_id, total_ghg_savings=total_ghg_savings,
                                total_solar_savings=total_solar_savings, total_cost_savings=total_cost_savings, 
                                local_business_count=local_business_count, council_facility_count=council_facility_count,
                                cf_total_ghg_savings=cf_total_ghg_savings, cf_total_solar_savings=cf_total_solar_savings, 
                                cf_total_cost_savings=cf_total_cost_savings, lb_total_ghg_savings=lb_total_ghg_savings, 
                                lb_total_solar_savings=lb_total_solar_savings, lb_total_cost_savings=lb_total_cost_savings)

    @app.route('/update_report', methods=['POST'])
    def update_report():
        report_id = request.form.get('report_id')
        column_name = request.form.get('column_name')
        value = request.form.get('value')

        report = EmissionReport.query.get(report_id)

        if not report:
            return jsonify(status="error", message="Report not found")

        if column_name == "co2_emissions_solar":
            report.co2_emissions_solar = float(value)
        elif column_name == "cost_savings":
            report.cost_savings = float(value)
        elif column_name == "total_emissions":
            report.total_emissions = float(value)
        elif column_name == "type":
            report.business_or_facility.type = value
        else:
            return jsonify(status="error", message="Invalid column name")

        db.session.commit()

        return jsonify(status="success")

    @app.route('/delete_report/<int:report_id>', methods=['POST'])
    def delete_report(report_id):
        report = EmissionReport.query.get(report_id)
        
        if report:
            business_id = report.business_or_facility_id
            db.session.delete(report)
            db.session.commit()
            
            # Check if the business has other reports
            other_reports = EmissionReport.query.filter_by(business_or_facility_id=business_id).all()
            if not other_reports:  # If no other reports for this business
                business = BusinessOrFacility.query.get(business_id)
                if business:
                    db.session.delete(business)
                    db.session.commit()

            return jsonify(status="success")
        else:
            return jsonify(status="error", message="Report not found")

    @app.route('/add_business_report', methods=['GET', 'POST'])
    def add_business_report():
        businesses_or_facilities = BusinessOrFacility.query.all()  # Get all businesses
        reporting_periods = ReportingPeriod.query.all()
        show_error_modal = False
        error_msg = ""
        
        if request.method == 'POST':
            business_or_facility_id = request.form['business_or_facility']
            
            if business_or_facility_id == "new":  # if the user wants to add a new business
                name = request.form['name']
                type_ = request.form['type']

                existing_biz = BusinessOrFacility.query.filter_by(name=name).first()
                if existing_biz:
                    error_msg = "This business or facility already exists!"
                    show_error_modal = True
                    return render_template('add_business_report.html', businesses_or_facilities=businesses_or_facilities, reporting_periods=reporting_periods, show_error_modal=show_error_modal, error_msg=error_msg)
                else:
                    business_or_facility = BusinessOrFacility(name=name, type=type_)
                    db.session.add(business_or_facility)
                    db.session.commit()
                    business_or_facility_id = business_or_facility.id  # Update the id for new business
            
            reporting_period_id = request.form['reporting_period']

            existing_report = EmissionReport.query.filter_by(business_or_facility_id=business_or_facility_id, reporting_period_id=reporting_period_id).first()
            if existing_report:
                error_msg = "An emission report for this business in the selected reporting period already exists!"
                show_error_modal = True
            else:
                co2_emissions_solar = request.form['co2_emissions_solar']
                total_emissions = request.form['total_emissions']
                cost_savings = request.form['cost_savings']

                report = EmissionReport(co2_emissions_solar=co2_emissions_solar, total_emissions=total_emissions, 
                                        cost_savings=cost_savings, reporting_period_id=reporting_period_id, 
                                        business_or_facility_id=business_or_facility_id)
                db.session.add(report)
                db.session.commit()
                return redirect(url_for('view_reports'))

        return render_template('add_business_report.html', businesses_or_facilities=businesses_or_facilities, reporting_periods=reporting_periods, show_error_modal=show_error_modal, error_msg=error_msg)

    @app.route('/api/emissions_by_reporting_period')
    def api_emissions_by_reporting_period():
        periods = ReportingPeriod.query.all()
        data = []
        for period in periods:
            reports = period.reports
            total_co2_solar = sum([r.co2_emissions_solar for r in reports])
            total_other = sum([r.other_emissions for r in reports])
            data.append({
                'start_month': period.start_month,
                'end_month': period.end_month,
                'start_year': period.start_year,
                'end_year': period.end_year,
                'co2_solar': total_co2_solar,
                'other_emissions': total_other
            })
        return jsonify(data)
    
    @app.route('/api/emissions_by_council_and_business')
    def api_emissions_by_council_and_business():
        businesses_and_facilities = BusinessOrFacility.query.all()
        data = []

        for entity in businesses_and_facilities:
            reports = entity.reports
            total_co2_solar = sum([r.co2_emissions_solar for r in reports])
            total_other = sum([r.other_emissions for r in reports])

            data.append({
                'name': entity.name,
                'type': entity.type,  # This will be either 'local business' or 'council facility'
                'co2_solar': total_co2_solar,
                'other_emissions': total_other
            })

        return jsonify(data)

    @app.route('/api/top5_council_facilities_by_total_emissions')
    def top5_council_facilities_by_total_emissions():
        facilities = BusinessOrFacility.query.filter_by(type='council facility').all()
        data = []
        for facility in facilities:
            reports = facility.reports
            total_emissions = sum([r.total_emissions for r in reports])
            data.append({
                'name': facility.name,
                'co2_solar': sum([r.co2_emissions_solar for r in reports]),
                'other_emissions': sum([r.other_emissions for r in reports]),
                'total_emissions': total_emissions
            })
        data.sort(key=lambda x: x['total_emissions'], reverse=True)
        return jsonify(data[:5])

    @app.route('/api/top5_local_businesses_by_total_emissions')
    def top5_local_businesses_by_total_emissions():
        facilities = BusinessOrFacility.query.filter_by(type='local business').all()
        data = []
        for facility in facilities:
            reports = facility.reports
            total_emissions = sum([r.total_emissions for r in reports])
            data.append({
                'name': facility.name,
                'co2_solar': sum([r.co2_emissions_solar for r in reports]),
                'other_emissions': sum([r.other_emissions for r in reports]),
                'total_emissions': total_emissions
            })
        data.sort(key=lambda x: x['total_emissions'], reverse=True)
        return jsonify(data[:5])

    @app.route('/api/top5_council_facilities_by_solar_pv')
    def top5_council_facilities_by_solar_pv():
        facilities = BusinessOrFacility.query.filter_by(type='council facility').all()
        data = []
        for facility in facilities:
            reports = facility.reports
            total_solar = sum([r.co2_emissions_solar for r in reports])
            data.append({
                'name': facility.name,
                'co2_solar': total_solar,
                'other_emissions': sum([r.other_emissions for r in reports])
            })
        data.sort(key=lambda x: x['co2_solar'], reverse=True)
        return jsonify(data[:5])

    @app.route('/api/top5_local_businesses_by_solar_pv')
    def top5_local_businesses_by_solar_pv():
        facilities = BusinessOrFacility.query.filter_by(type='local business').all()
        data = []
        for facility in facilities:
            reports = facility.reports
            total_solar = sum([r.co2_emissions_solar for r in reports])
            data.append({
                'name': facility.name,
                'co2_solar': total_solar,
                'other_emissions': sum([r.other_emissions for r in reports])
            })
        data.sort(key=lambda x: x['co2_solar'], reverse=True)
        return jsonify(data[:5])

    @app.route('/api/top5_council_facilities_by_other_emissions')
    def top5_council_facilities_by_other_emissions():
        facilities = BusinessOrFacility.query.filter_by(type='council facility').all()
        data = []
        for facility in facilities:
            reports = facility.reports
            other_emissions = sum([r.other_emissions for r in reports])
            data.append({
                'name': facility.name,
                'co2_solar': sum([r.co2_emissions_solar for r in reports]),
                'other_emissions': other_emissions
            })
        data.sort(key=lambda x: x['other_emissions'], reverse=True)
        return jsonify(data[:5])

    @app.route('/api/top5_local_businesses_by_other_emissions')
    def top5_local_businesses_by_other_emissions():
        facilities = BusinessOrFacility.query.filter_by(type='local business').all()
        data = []
        for facility in facilities:
            reports = facility.reports
            other_emissions = sum([r.other_emissions for r in reports])
            data.append({
                'name': facility.name,
                'co2_solar': sum([r.co2_emissions_solar for r in reports]),
                'other_emissions': other_emissions
            })
        data.sort(key=lambda x: x['other_emissions'], reverse=True)
        return jsonify(data[:5])

    @app.route('/api/top5_facilities_by_cost_savings')
    def top5_facilities_by_cost_savings():
        facilities = BusinessOrFacility.query.all()
        data = []
        for facility in facilities:
            reports = facility.reports
            cost_savings = sum([r.cost_savings for r in reports])
            data.append({
                'name': facility.name,
                'cost_savings': cost_savings
            })
        data.sort(key=lambda x: x['cost_savings'], reverse=True)
        return jsonify(data[:5])

    @app.route('/api/bottom5_facilities_by_cost_savings')
    def bottom5_facilities_by_cost_savings():
        facilities = BusinessOrFacility.query.all()
        data = []
        for facility in facilities:
            reports = facility.reports
            cost_savings = sum([r.cost_savings for r in reports])
            data.append({
                'name': facility.name,
                'cost_savings': cost_savings
            })
        data.sort(key=lambda x: x['cost_savings'])
        return jsonify(data[:5])

    @app.route('/api/pie_chart_cost_savings')
    def pie_chart_cost_savings():
        facilities = BusinessOrFacility.query.all()
        data = []
        for facility in facilities:
            reports = facility.reports
            cost_savings = sum([r.cost_savings for r in reports])
            data.append({
                'name': facility.name,
                'cost_savings': cost_savings
            })
        return jsonify(data)
        logout_user()
        return redirect(url_for('index'))
    
    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()