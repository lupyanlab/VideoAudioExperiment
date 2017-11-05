// Function Call to Run the experiment
function runExperiment(trials, subjCode, workerId, assignmentId, hitId) {
    let timeline = [];

    // Data that is collected for jsPsych
    let turkInfo = jsPsych.turk.turkInfo();
    let participantID = makeid() + 'iTi' + makeid()

    jsPsych.data.addProperties({
        subject: participantID,
        condition: 'explicit',
        group: 'shuffled',
        workerId: workerId,
        assginementId: assignmentId,
        hitId: hitId
    });

    // sample function that might be used to check if a subject has given
    // consent to participate.
    var check_consent = function (elem) {
        if ($('#consent_checkbox').is(':checked')) {
            return true;
        }
        else {
            alert("If you wish to participate, you must check the box next to the statement 'I agree to participate in this study.'");
            return false;
        }
        return false;
    };


    // declare the block.
    var consent = {
        type: 'html',
        url: "./consent.html",
        cont_btn: "start",
        check_fn: check_consent
    };

    // timeline.push(consent);

    let welcome_block = {
        type: "text",
        cont_key: ' ',
        text: `<h1>Categories Experiment</h1>
        <p class="lead">Welcome to the experiment. Thank you for participating! Press SPACE to begin.</p>`
    };

    timeline.push(welcome_block);

    let continue_space = "<div class='right small'>(press SPACE to continue)</div>";

    let instructions = {
        type: "instructions",
        key_forward: ' ',
        key_backward: 8,
        pages: [
            `<p class="lead">In this experiment, you will see images of a single category, and your job is to type your shortest and best answer that describes the images shown.
            </p> <p class="lead">Your score will be based on how well your answer coordinates with other previous answers.
            </p> <p class="lead">Use the your keyboard and click on the text box to type in your answer. Then, click on the displayed button to submit your answer.
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
            participantID: participantID,
            category: category,
            expTimer: -1,
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
        <div class="progress progress-striped active">
            <div class="progress-bar progress-bar-success" style="width: ${trial_number / num_trials * 100}%;"></div>
        </div>
        <h6 style="text-align:center;">Trial ${trial_number} of ${num_trials}</h6>
        `+ imagesHTML;

        let questions = ['<h4>What are these items called?</h4>'];

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
                    url: 'http://' + document.domain + ':' + PORT + '/data',
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
        trial_number++;
    };


    let questionsInstructions = {
        type: "instructions",
        key_forward: ' ',
        key_backward: 8,
        pages: [
            `<p class="lead">This is a filler for instructions for the questions.
            </p> ${continue_space}`,
        ]
    };
    timeline.push(questionsInstructions);


    window.questions = trials.questions;    // allow surveyjs to access questions
    let IRQTrial = {
        type: 'html',
        url: "./IRQ/IRQ.html",
        cont_btn: "IRQ-cmplt",
        check_fn: function() {
            if(IRQIsCompleted()) {
                console.log(getIRQResponses());
                let IRQ = Object.assign({subjCode}, getIRQResponses().answers);
                // POST demographics data to server
                $.ajax({
                    url: 'http://' + document.domain + ':' + PORT + '/IRQ',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(IRQ),
                    success: function (data) {
                        // console.log(data);
                        // $('#surveyElement').remove();
                        // $('#surveyResult').remove();
                    }
                })
                return true;
            }
            else {
                return false;
            }
        }
    };
    timeline.push(IRQTrial);

    let demographicsTrial = {
        type: 'html',
        url: "./demographics/demographics.html",
        cont_btn: "demographics-cmplt",
        check_fn: function() {
            if(demographicsIsCompleted()) {
                console.log(getDemographicsResponses());
                let demographics = Object.assign({subjCode}, getDemographicsResponses());
                // POST demographics data to server
                $.ajax({
                    url: 'http://' + document.domain + ':' + PORT + '/demographics',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(demographics),
                    success: function () {
                    }
                })
                return true;
            }
            else {
                return false;
            }
        }
    };
    timeline.push(demographicsTrial);

    let endmessage = `
    <p class="lead">Thank you for participating! Your completion code is ${participantID}. Copy and paste this in 
    MTurk to get paid. If you have any questions or comments, please email jsulik@wisc.edu.</p>
    
    <h3>Debriefing </h3>
    <p class="lead">
    Thank you for your participation. The study is designed to collect information about the different ways 
    in which people typically represent thoughts in their mind. The responses will be used in the 
    development of a shorter questionnaire to assess differences in these representations. 
    </p>
    
    `


    let images = [];
    // add scale pic paths to images that need to be loaded
    images.push('img/scale.png');
    for (let i = 1; i <= 7; i++)
        images.push('img/scale' + i + '.jpg');

    jsPsych.pluginAPI.preloadImages(images, function () { startExperiment(); });
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