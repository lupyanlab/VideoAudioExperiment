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

    timeline.push(consent);

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

    let scale = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
    let questionsTrial = {
        type: 'survey-likert',
        questions: trials.questions,
        labels: _.map(trials.questions, (q) => { return scale }), // need one scale for every question on a page,
        on_finish: function (data) {
            console.log(data);
        }
    }

    // timeline.push(questionsTrial);

    let demographicsTrial = {
        type: 'html',
        url: "./demographics/demographics.html",
        cont_btn: "cmplt",
        check_fn: function() {
            if(isCompleted()) {
                console.log(getResponses());
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
    
    <h1>This is the debriefing text. </h1>
    
    <p>
        Quis magna commodo nostrud sunt ex fugiat sunt fugiat. Esse cupidatat eu consequat aliquip ex mollit do ea adipisicing. Quis laborum voluptate enim incididunt exercitation.
    </p>
    
    <p>
        Proident sit do amet incididunt duis enim cupidatat. Excepteur deserunt veniam veniam culpa cupidatat commodo proident. Lorem exercitation anim commodo irure quis deserunt officia deserunt cillum esse consectetur ullamco laboris. Aliqua ullamco irure incididunt sunt irure aliqua cillum ea fugiat aliquip. Excepteur mollit eu sint commodo ex sint non amet laboris aliquip labore.
    </p>
    
    <p>
        Magna aute nisi eiusmod id qui eiusmod sit amet culpa ea anim. Veniam nostrud deserunt cupidatat consectetur nisi mollit nisi do sunt Lorem est. Adipisicing aliqua cillum culpa nostrud incididunt. Aliquip in eu Lorem aliquip deserunt consequat ea aliqua officia voluptate. Mollit veniam in dolor excepteur duis consectetur excepteur amet aliqua sunt cillum officia excepteur laborum. Incididunt elit laboris Lorem reprehenderit adipisicing qui nisi aliqua nulla velit cillum enim. Aliquip dolor amet cillum tempor eu veniam exercitation cillum et labore laboris sint.
    </p>
    
    <p>
        Duis ex duis aute sint sit amet consequat quis magna aliquip reprehenderit est. Adipisicing cupidatat nostrud nulla voluptate ipsum culpa. Lorem cillum anim ipsum non ea amet. Qui labore excepteur non non nostrud. Est aliquip labore ea eu.
    </p>
    
    <p>
    In reprehenderit mollit consequat eu laboris fugiat adipisicing sunt magna. Nisi aute do commodo magna labore cupidatat voluptate irure aliqua labore sit sunt. Pariatur adipisicing ad voluptate ut aute culpa ipsum.
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