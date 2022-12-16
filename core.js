import DOMPurify from "isomorphic-dompurify";
import { parseWikiProblem, parseKatex } from "vo-core";
import problemCache from "./problemPages.json" assert { type: "json" };
function randomArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}
const generateProblems = async ({ contestSelection, contestDetails }) => {
    let generatedProblems = [];
    let problemAnswerTypes = [];
    Object.entries(contestSelection).forEach(([contest, selected], i) => {
        if (!selected) {
            return;
        }
        const details = contestDetails[contest];
        let contestProblems = problemCache[contest].slice(0);
        randomArray(contestProblems);
        generatedProblems.push(contestProblems.slice(0, details.problemCount));
        for (let i = 0; i < details.problemCount; ++i) {
            problemAnswerTypes.push(contest == "aime" ? "aime" : "amc");
        }
    });
    generatedProblems = generatedProblems.flat();
    const problems = await Promise.allSettled(generatedProblems.map((problem) => parseWikiProblem(problem)));
    return problems.map(({ status, value }, i) => {
        if (status != "fulfilled" || !value?.problem) {
            console.error("ERROR: " + generatedProblems[i] + " failed to resolve");
            return null;
        }
        return {
            ...value,
            answerType: problemAnswerTypes[i],
            problem: DOMPurify.sanitize(parseKatex(value.problem), {
                FORBID_TAGS: ["a"],
            }),
        };
    });
};
export { generateProblems };
