function getPersonalityDetails(selectedPersonalityTitle) {
    // Define your logic to retrieve steps and teach based on selectedPersonalityTitle
    let steps = "";
    let teach = "";

    // Example logic, replace this with your actual logic
    if (selectedPersonalityTitle === "Nike") {
        steps = "Nike is a brand that sells best  athletic footwear it gives a normal person a feal to be an athelete";
        teach = "Nike best sells Nike dunks and Nike Air max which are lifestyle Air Max brings you style, comfort and big attitude in the Nike Air Max 270. The design draws inspiration from Air Max icons, showcasing Nike's greatest innovation with its large window and fresh array of colors.";     
;
        teach = "how to write creatively";
    } else if (selectedPersonalityTitle === "Extrovert") {
        steps = "Steps for extroverts";
        teach = "Teaching extroverts";      
    } else if (selectedPersonalityTitle === "Nik2e") {
        steps = "Nike is a brand that sells best  athletic footwear it gives a normal person a feal to be an athelete";
        teach = "Nike best sells Nike dunks and Nike Air max which are lifestyle Air Max brings you style, comfort and big attitude in the Nike Air Max 270. The design draws inspiration from Air Max icons, showcasing Nike's greatest innovation with its large window and fresh array of colors.";     
    } else {
        // Default values if no match is found
        steps = "Default steps";
        teach = "Default teaching";
    }

    return { steps, teach };
}

// Attach the function to the global object
window.getPersonalityDetails = getPersonalityDetails;
