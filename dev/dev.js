const PORT = 7072;
const FULLSCREEN = false;
$(document).ready(function(){

    // This listens to the form on-submit action
    $("form").submit(function(){    // Remove


        //////////////////////////////////////////
        // DEFINE workerId, hitId, assignmentId HERE
        //////////////////////////////////////////
        let subjCode = $("#subjCode").val().slice();
        let workerId = 'workerId';
        let assignmentId = 'assignmentId';
        let hitId = 'hitId';

        $("form").remove();
        $("#loading").html('Loading trials... please wait. </br> <img src="img/preloader.gif">')

        // This calls server to run python generate trials (judements.py) script
        // Then passes the generated trials to the experiment
        $.ajax({
            url: 'http://'+document.domain+':'+PORT+'/trials',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({subjCode: subjCode}),
            success: function (data) {
                console.log(data);

                let images = [];
                let categories = data.trials.categories.slice(0,5);
                let stimuli = data.trials.images;

                for (let category of categories) {
                    for (let file of stimuli[category]) {
                        images.push(file);
                    }
                }
                jsPsych.pluginAPI.preloadImages(images, function(){ 
                    
                    $("#loading").remove();
                    runExperiment({categories, images: stimuli, questions: data.trials.questions}, subjCode, workerId, assignmentId, hitId);
                
                });
            }
        })
    }); // Remove
    

});