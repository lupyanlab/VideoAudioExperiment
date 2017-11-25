const PORT = 7080;
const FULLSCREEN = false;
$(document).ready(function(){

    // This listens to the form on-submit action
    $("form").submit(function(){    // Remove


        //////////////////////////////////////////
        // DEFINE workerId, hitId, assignmentId HERE
        //////////////////////////////////////////
        let subjCode = $("#subjCode").val().slice();
        let sessionId = $("#sessionId").val().slice();
        let workerId = 'null';
        let assignmentId = 'null';
        let hitId = 'null';

        $("form").remove();
        $("#loading").html('<h2 style="text-align:center;">Loading trials... please wait.</h2> </br> <div  class="col-md-2 col-md-offset-5"><img src="img/preloader.gif"></div>')

        $.ajax({
            url: 'http://'+document.domain+':'+PORT+'/trials',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({subjCode, sessionId}),
            success: function (data) {
                console.log(data);
                
                
                // jsPsych.pluginAPI.preloadImages(images, function(){}); 
                runExperiment(data.trials, subjCode, data.questions, workerId, assignmentId, hitId);
    
            }
        })
    }); // Remove
    

});