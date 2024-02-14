  let studentSubmissionUrl =
  Cypress.env("STUDENT_SUBMISSION_URL") || "http://localhost:3000";
if (studentSubmissionUrl.endsWith("/")) {
  studentSubmissionUrl = studentSubmissionUrl.slice(0, -1);
}
const firstName = "L10 VTA";
const lastName = "User";
const email = "vta@pupilfirst.com";
const password = "123456789";

describe("Preparing for Level 10 milestone testing, first we will verify signup", () => {
  it("Should create an account", () => {
    cy.visit(studentSubmissionUrl + "/signup");
    cy.get('input[name="firstName"]').should("exist");
    cy.get('input[name="email"]').should("exist");
    cy.get('input[name="password"]').should("exist");

    cy.get('input[name="firstName"]').type("L10 user");
    cy.get('input[name="email"]').type("vta@pupilfirst.com");
    cy.get('input[name="password"]').type("12345678");

    if (cy.get('input[name="lastName"]')) {
      cy.get('input[name="lastName"]').type("User");
    }
    cy.get('button').click();

    cy.wait(500);
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq("/login");
    });
  });
});