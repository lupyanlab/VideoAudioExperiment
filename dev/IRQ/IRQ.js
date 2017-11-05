Survey.Survey.cssType = "bootstrap";
Survey.defaultBootstrapCss.navigationButton = "btn btn-green";

window.survey = new Survey.Model({questions: [
{ type: "matrix", name: "Quality", isRequired: true, title: "Please indicate if you agree or disagree with the following statements",
   columns: [{ value: "Strongly Disagree", text: "Strongly Disagree" }, 
              { value: "Disagree" , text: "Disagree" }, 
              { value: "Neutral", text: "Neutral" }, 
              { value: "Agree", text: "Agree" }, 
              { value: "Strongly Agree", text: "Strongly Agree" }],
    rows: [{ value: "affordable", text: "Product is affordable"}, 
           { value: "does what it claims", text: "Product does what it claims" },
           { value: "better then others", text: "Product is better than other products on the market" }, 
           { value: "easy to use", text: "Product is easy to use" }]}
]});

let IRQCompleted = false;
function IRQIsCompleted() {
    return IRQCompleted;
}
let IRQResponses = {};
function getIRQResponses() {
    return IRQResponses;
}

survey.onComplete.add(function(result) {
    IRQCompleted = true;
    IRQResponses = result.data;
    // document.querySelector('#surveyResult').innerHTML = "result: " + JSON.stringify(result.data);
});

$("#surveyElement").Survey({ 
    model: survey,
    onValidateQuestion: surveyValidateQuestion
});

function surveyValidateQuestion(s, options) {
    if (options.name === 'Quality') {
        var question = s.getQuestionByName("Quality");
        if(!question.rows.every(function(row) { return (options.value || {})[row.itemValue] !== undefined; })) {
            options.error = "All rows should be answered.";
        }
    }
}

$(document).ready(function(){
    survey.showCompletedPage = false;
    $('#surveyElement').find('.sv_complete_btn').attr('id', 'IRQ-cmplt');
});
