let studentSubmissionUrl =
  Cypress.env("STUDENT_SUBMISSION_URL");


  let studentSubmissionUrl =
  Cypress.env("STUDENT_SUBMISSION_URL") || "http://localhost:3000";
if (studentSubmissionUrl.endsWith("/")) {
  studentSubmissionUrl = studentSubmissionUrl.slice(0, -1);
}
const clearSignUpFields = (cy) => {
  cy.get('input[name="firstName"]').clear();
  cy.get('input[name="email"]').clear();
  cy.get('input[name="password"]').clear();
  if (cy.get('input[name="lastName"]')) {
    cy.get('input[name="lastName"]').clear();
  }
};
const clearLoginFields = (cy) => {
  cy.get('input[name="email"]').clear();
  cy.get('input[name="password"]').clear();
};

const clearFields = (cy) => {
  cy.get('input[name="title"]').clear();
  cy.get('input[name="dueDate"]').clear();
};

function formatDateWithOffset(daysOffset = 0) {
  const date = new Date(); // Get the current date
  date.setDate(date.getDate() + daysOffset); // Add or subtract days based on the offset

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const firstName = "L10 VTA";
const lastName = "User";
const email = "vta@pupilfirst.com";
const password = "123456789";

describe("Preparing for Level 10 milestone testing, first we will verify signup", () => {
  it("should not create an account with empty email, password, or firstName", () => {
    cy.visit(studentSubmissionUrl + "/signup");
    cy.get('input[name="firstName"]').should("exist");
    cy.get('input[name="email"]').should("exist");
    cy.get('input[name="password"]').should("exist");

    clearSignUpFields(cy);

    // Empty firstName
    cy.get('input[name="email"]').type("vta@pupilfirst.com");
    cy.get('input[name="password"]').type("12345678");

    if (cy.get('input[name="lastName"]')) {
      cy.get('input[name="lastName"]').type("User");
    }
    cy.get('button[type="submit"]').click();

    cy.wait(500);
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq("/signup");
    });

    // Empty email
    clearSignUpFields(cy);
    cy.get('input[name="firstName"]').type("L10 user");
    cy.get('input[name="password"]').type("12345678");

    if (cy.get('input[name="lastName"]')) {
      cy.get('input[name="lastName"]').type("User");
    }
    cy.get('button[type="submit"]').click();

    cy.wait(500);
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq("/signup");
    });

    // Empty password
    clearSignUpFields(cy);
    cy.get('input[name="firstName"]').type("L10 user");
    cy.get('input[name="email"]').type("l10vta@pupilfirst.com");

    if (cy.get('input[name="lastName"]')) {
      cy.get('input[name="lastName"]').type("User");
    }
    cy.get('button[type="submit"]').click();

    cy.wait(500);
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq("/signup");
    });
  });
});