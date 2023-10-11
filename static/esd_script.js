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

    // Handling dropdown changes for ESD script
    $('.editable-select').on('change', function() {
        var newValue = $(this).val();
        updateValue($(this), newValue);
    });
});
