const readline = require('readline');

const Question = function(r1, question) {
    return new Promise(function(resolve) {
        r1.question(question, (answer) => {
            resolve(answer);
        });
    });
};

const Questionnaire = function(questions) {
    return new Promise(async function(resolve) {
        let r1, i, answers, answer, answered, question, txt;

        r1 = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        answers = [];
        for (i=0; i<questions.length; ++i) {
            answered = false;
            while (!answered) {
                question = questions[i];
                txt = [];
                txt.push(question.question);
                if (question.min_length) {
                    txt.push('(Min. length - ' + question.min_length + ')');
                }
                if (question.max_length) {
                    txt.push('(Max. length - ' + question.max_length + ')');
                }
                if (question.default_answer && question.default_answer.length > 0) {
                    txt.push('(Default: ' + question.default_answer + ')');
                }
                txt = txt.join(' ') + ': ';
                answer = await Question(r1, txt);
                if (question.mandatory) {
                    if (answer.length > 0) {
                        if (question.min_length && answer.length < question.min_length) {
                            // answer length is less than min. length. not valid.
                        }
                        else if (question.max_length && answer.length > question.max_length) {
                            // answer length is greater than max. length. not valid.
                        }
                        else {
                            answers.push(answer);
                            answered = true;
                        }
                    }
                    else if (question.default_answer) {
                        answers.push(question.default_answer);
                        answered = true;
                    }
                }
                else {
                    if (answer.length > 0) {
                        answers.push(answer);
                    }
                    else {
                        if (question.default_answer) {
                            answers.push(question.default_answer);
                        }
                        else {
                            answers.push(undefined);
                        }
                    }
                    answered = true;
                }
            }
        }

        r1.close();
        resolve(answers);
    });
};

module.exports = Questionnaire;
