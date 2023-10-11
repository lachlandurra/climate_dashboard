$(document).ready(function() {
    // Function to update value for business script
    function updateValue(element, newValue) {
        var cell = element.closest('td');
        var reportId = cell.attr('data-report-id');
        var column = cell.attr('data-type');
    
        $.ajax({
            type: "POST",
            url: "/update_report",
            data: {
                report_id: reportId,  
                column_name: column,
                value: newValue
            },
            success: function(response) {
                if(response.status === 'success') {
                    var row = element.closest('tr');
                    
                    // Update the 'other_emissions' cell in the table
                    row.find('td[data-type="other_emissions"]').text(response.other_emissions.toFixed(2));
                } else {
                    alert("There was an error updating the report: " + response.message);
                }
            }
            
                  
        });
    }

    $('td[contenteditable="true"]').on('blur', function() {
        var newValue = $(this).text();
        updateValue($(this), newValue);
    });

    $(".delete-report").click(function() {
        var reportId = $(this).data('report-id');
        
        if(confirm("Are you sure you want to delete this report?")) {
            $.ajax({
                type: "POST",
                url: "/delete_report/" + reportId,
                success: function(response) {
                    if(response.status === 'success') {
                        location.reload();  // Refresh the page to reflect changes
                    } else {
                        alert("Error deleting report: " + response.message);
                    }
                }
            });
        }
    });

    $('.report-type-dropdown').change(function() {
        var reportId = $(this).data('report-id');
        var newValue = $(this).val();

        $.post("/update_report", {
            report_id: reportId,
            column_name: "type",
            value: newValue
        }).done(function(data) {
            if (data.status === 'success') {
                var row = $(this).closest('tr');
                // Update other cells in the row based on the new data received from the server
                // Make sure the server sends back updated data for the entire row
                row.find('td[data-type="total_emissions"]').text(data.total_emissions);
                row.find('td[data-type="co2_emissions_solar"]').text(data.co2_emissions_solar);
                row.find('td[data-type="cost_savings"]').text(data.cost_savings);
            } else {
                alert("Failed to update report type. " + data.message);
            }
        });
    });
});
