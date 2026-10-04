@level0 @smoke
Feature: TTACart login (Level 0)
  As a QA engineer
  I want to verify the Cucumber + Playwright setup works
  So that I can start writing BDD tests

  Scenario: A standard user can login and reach the inventory
    Given I open the TTACart login page
    When I login as the standard user
    Then The inventory page is displayed
