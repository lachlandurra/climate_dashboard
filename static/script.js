$(document).ready(function() {

    $('td[contenteditable="true"]').on('blur', function() {
        var newValue = $(this).text();
        updateValue($(this), newValue);
    });    

    // Toggle visibility of 'Name' and 'Type' fields
    $('#business_or_facility').on('change', function() {
        if ($(this).val() === 'new') {
            $('#newBusinessFields').show();
        } else {
            $('#newBusinessFields').hide();
        }
    }).trigger('change');  // Trigger the change event to set the initial state

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
                if(response.status !== 'success') {
                    alert("There was an error updating the report: " + response.message);
                }
            }            
        });
    }

    // Modal error handling
    var modal = document.getElementById("errorModal");
    if(modal){
        // Get the close button
        var closeBtn = document.getElementsByClassName("close-btn")[0];

        // Show modal if error flag is present
        if (document.body.contains(document.querySelector('.show-error-modal'))) {
            modal.style.display = "block";
        }

        // Close the modal
        closeBtn.onclick = function() {
            modal.style.display = "none";
        }

        // Close modal when clicking outside of it
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    }

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
            if (data.status !== "success") {
                alert("Failed to update report type. " + data.message);
            }
        });
    });
    
});
