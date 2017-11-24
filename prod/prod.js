const PORT = 7073;
const FULLSCREEN = true;
$(document).ready(function(){

    
    $(window).on('beforeunload', function(){
        return 'Are you sure you want to leave?';
    });

    

        //////////////////////////////////////////
        // DEFINE workerId, hitId, assignmentId HERE
        //////////////////////////////////////////
        let subjCode = $.urlParam('workerId') || 'unknown';
        let workerID = 'workerId';

        $("#loading").html('<h2 style="text-align:center;">Loading trials... please wait.</h2> </br> <div  class="col-md-2 col-md-offset-5"><img src="img/preloader.gif"></div>')
        
        $.ajax({
            url: 'http://'+document.domain+':'+PORT+'/trials',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({subjCode, sessionID}),
            success: function (data) {
                console.log(data);
                
                
                // jsPsych.pluginAPI.preloadImages(images, function(){}); 
                runExperiment(data.trials, subjCode, data.questions, workerId, assignmentId, hitId);
    
            }
        })    

});