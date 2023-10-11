$(document).ready(function() {
    // Function to update value for ESD script
    function updateValue(element, newValue) {
        var cell = element.closest('td');
        var dataId = cell.attr('data-data-id');
        var column = cell.attr('data-type');
        
        $.ajax({
            type: "POST",
            url: "/update_data",
            data: {
                data_id: dataId,  
                column_name: column,
                value: newValue
            },
            success: function(response) {
                console.log(response);
                if(response.status === 'success') {
                    // Update the entire row's content instantly
                    var row = element.closest('tr');
                    row.find('td[data-type="year"]').text(response.year);
                    row.find('select[data-type="half_year"]').val(response.half_year);
                    row.find('select[data-type="class"]').val(response.class_);
                    row.find('td[data-type="star_rating"]').text(response.star_rating);
                    row.find('td[data-type="avg_conditioned_area"]').text(response.avg_conditioned_area);
                    row.find('.mj-saved').text(response.mj_saved_per_annum);
                    row.find('.emissions-reduction').text(response.emissions_reduction);
                } else {
                    alert("There was an error updating the data: " + response.message);
                }
            }            
        });
    }

    $('td[contenteditable="true"]').on('blur', function() {
        var newValue = $(this).text();
        updateValue($(this), newValue);
    });

    $('.editable-select[data-type="half_year"]').change(function() {
        var dataId = $(this).data('data-id');
        var newValue = $(this).val();
        console.log("Data ID Sent: ", dataId);
        console.log('New Value:', newValue);  // Log the new value
    
        $.post("/update_data", {
            data_id: dataId,
            column_name: "half_year",
            value: newValue
        }).done(function(data) {
            console.log('Response:', data);  // Log the entire response
    
            if (data.status === 'success') {
                // Handle success
            } else {
                alert("Failed to update half of the year. " + data.message);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('AJAX Error:', textStatus, errorThrown);  // Log AJAX errors
        });
    });
    
    
    // for Class
    $('.editable-select[data-type="class"]').change(function() {
        var dataId = $(this).data('data-id');
        var newValue = $(this).val();
        console.log("Data ID Sent: ", dataId);
        console.log('New Value:', newValue);  // Log the new value
    
        $.post("/update_data", {
            data_id: dataId,
            column_name: "class",
            value: newValue
        }).done(function(data) {
            if (data.status === 'success') {
                // Again, you can update other cells here if needed
            } else {
                alert("Failed to update class. " + data.message);
            }
        });
    });
    
});

