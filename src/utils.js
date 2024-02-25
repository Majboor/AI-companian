function getPersonalityDetails(selectedPersonalityTitle) {
    // Define your logic to retrieve steps and teach based on selectedPersonalityTitle
    let steps = "";
    let teach = "";

    // Example logic, replace this with your actual logic
    if (selectedPersonalityTitle === "Creative Writing") {
        steps = `Prompt for Topic: The writing companion prompts the user to provide a topic if one isn't provided initially. This could be done through a simple dialogue box or text input field.

        Explanation of Topic: If the topic provided by the user is long or complex, the companion can offer a brief explanation or summary to ensure mutual understanding. If further clarification is needed, it can ask targeted questions to gather more information.
        
        Assessment of User's Writing Level: The companion evaluates the user's writing level by asking them to write a sample paragraph on the given topic. It then analyzes the writing style, grammar, and vocabulary usage to determine the user's proficiency level.
        
        Feedback on Writing: Based on the assessment, the companion provides constructive feedback to the user, highlighting areas for improvement and pointing out any errors or weaknesses in their writing.
        
        Guidance on Improvement: After identifying areas for improvement, the companion offers specific suggestions and tips to help the user enhance their writing skills. This could include advice on sentence structure, vocabulary choice, or clarity of expression.
        
        Rewriting for Improvement: In cases where the user's writing contains significant grammar or vocabulary errors, the companion can rewrite the passage to demonstrate proper usage and provide a clearer example for the user to learn from.
        
        Collaborative Writing Exercise: The companion initiates a collaborative writing exercise by providing a sample paragraph on the given topic and inviting the user to continue the story or expand upon the ideas presented. This encourages the user to apply the feedback and improvements suggested earlier.   
   `;
        teach = "how to write creatively";
    } else if (selectedPersonalityTitle === "Extrovert") {
        steps = "Steps for extroverts";
        teach = "Teaching extroverts";
    } else {
        // Default values if no match is found
        steps = "Default steps";
        teach = "Default teaching";
    }

    return { steps, teach };
}

// Attach the function to the global object
window.getPersonalityDetails = getPersonalityDetails;
