$(document).ready(function() {
    // Toggle visibility of 'Name' and 'Type' fields
    $('#business_or_facility').on('change', function() {
        if ($(this).val() === 'new') {
            $('#newBusinessFields').show();
            $('#name').attr('required', true);
        } else {
            $('#newBusinessFields').hide();
            $('#name').removeAttr('required');
        }
    }).trigger('change'); // Trigger the change event to set the initial state

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
});
