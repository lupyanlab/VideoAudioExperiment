// Function Call to Run the experiment
function runExperiment(trials, subjCode, workerId, assignmentId, hitId) {
    let timeline = [];

    // Data that is collected for jsPsych
    let turkInfo = jsPsych.turk.turkInfo();
    let participantID = makeid()+'iTi'+makeid()

    jsPsych.data.addProperties({
        subject: participantID,
        condition: 'explicit',
        group: 'shuffled',
        workerId: workerId,
        assginementId: assignmentId,
        hitId: hitId
    });

    let welcome_block = {
        type: "text",
        cont_key: ' ',
        text: `<h1>Categories Experiment</h1>
        <p>Welcome to the experiment. Thank you for participating! Press SPACE to begin.</p>`
    };

    timeline.push(welcome_block);

    let continue_space = "<div class='right small'>(press SPACE to continue, or BACKSPACE to head back)</div>";

    let instructions = {
        type: "instructions",
        key_forward: ' ',
        key_backward: 8,
        pages: [
            `<p>In this experiment, you will see images of a single category, and you will need to type your shortest and best answer that describes the images shown.
            </p> ${continue_space}`,
            
            `<p>Your score will be based on how well your answer coordinates with other previous answers.
            </p> ${continue_space}`,

            `<p>Use the your keyboard and click on the text box to type in your answer. Then, click on the displayed button to submit your answer.
            </p> ${continue_space}`,
        ]
    };

    timeline.push(instructions);

    let trial_number = 1;
    let num_trials = trials.categories.length;
    document.trials = trials;

    // Pushes each audio trial to timeline
    for (let category of trials.categories) {

        
        // Empty Response Data to be sent to be collected
        let response = {
            subjCode: subjCode,
            workerId: workerId,
            assignmentId: assignmentId,
            hitId: hitId,
            category: category,
            expTimer : -1,
            response: -1,
            trial_number: trial_number,
            rt: -1,
        }	

        let imagesHTML = '';
        for (let img of trials.images[category]) {
            imagesHTML += `<img src="${img}" style="max-width:16%;"/>`
        }

        let preamble = `
        <canvas width="800px" height="25px" id="bar"></canvas>
        <script>
            var barCanvas = document.getElementById('bar');
            var barCtx = barCanvas.getContext('2d');
            barCtx.roundRect(0, 0, barCanvas.width, barCanvas.height, 20).stroke();
            barCtx.roundRect(0, 0, barCanvas.width*${trial_number/num_trials}, barCanvas.height, 20).fill();
        </script>
        <h5 style="text-align:center;">Trial ${trial_number} of ${num_trials}</h5>
        `+imagesHTML;
        // <div style="clear: both;top:25%;width:100%;position: absolute;">
        //     <h1 style="text-align:center;float:left;width:50%;">${trial.word1}</h1>
        //     <h1 style="text-align:center;float:right;width:50%;">${trial.word2}</h1>
        // </div>

        let questions = ['What are these items called?'];

        // Picture Trial
        let wordTrial = {
            type: 'survey-text',
            preamble: preamble,
            questions: questions,

            on_finish: function (data) {
                console.log(data.responses);
                response.response = data.responses.Q0;
                response.rt = data.rt;
                response.expTimer = data.time_elapsed / 1000;

                // POST response data to server
                $.ajax({
                    url: 'http://'+document.domain+':'+PORT+'/data',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(response),
                    success: function () {
                        console.log(response);
                    }
                })
            }
        }
        timeline.push(wordTrial);

        // // let subject view their choice
        // let breakTrial = {
        //     type: 'single-stim',
        //     is_html: true,
        //     timing_response: 1000,
        //     response_ends_trial: false,

        //     stimulus: stimulus,

        //     prompt: function () { 
        //         return prompt + `
        //             <script>
        //                 ctx.beginPath();
        //                 ctx.arc(xCoords[${response.response-1}],yCoord,15,0,2*Math.PI);
        //                 ctx.stroke();
        //                 ctx.fill();
        //             </script>
        //             `;
        //     }
        // }
        // timeline.push(breakTrial);

        trial_number++;
    };


    let endmessage = `Thank you for participating! Your completion code is ${participantID}. Copy and paste this in 
        MTurk to get paid. If you have any questions or comments, please email jsulik@wisc.edu.`

    
    let images = [];
    // add scale pic paths to images that need to be loaded
    images.push('img/scale.png');
    for (let i = 1; i <= 7; i++)
        images.push('img/scale'+i+'.jpg');

    jsPsych.pluginAPI.preloadImages(images, function(){ startExperiment(); });
    document.timeline = timeline;
    function startExperiment() {
        jsPsych.init({
            default_iti: 0,
            timeline: timeline,
            fullscreen: FULLSCREEN,
            show_progress_bar: true,
            on_finish: function (data) {
                jsPsych.endExperiment(endmessage);
            }
        });
    }
}