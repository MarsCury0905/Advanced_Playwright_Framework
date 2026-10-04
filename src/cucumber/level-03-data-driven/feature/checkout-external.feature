@level2 @external @e2e
Feature: End-to-End checkout, data from an external JSON file (Level 2)

  Background:
    Given I am logged in as a standard user

  Scenario Outline: <person> completes a full checkout
    When I add a product "test-allthethings-tshirt-red" to the cart
    And I checkout as the "<person>" customer
    Then the order should be confirmed

    Examples:
      | person |
      | alice  |
      | bob    |
      | carol  |
