@level1 @login
Feature: TTA Cart Login
  As a user of TTACart
  I want to login with valid and invalid credentials
  So that I can access the application securely

  Background:
    Given I am on the TTA Cart login page

  @smoke @P0
  Scenario: Successful login with valid credentials
    When I log in as "standard_user" with password "tta_secret"
    Then I should land on the products page

  @negative
  Scenario: A locked-out user is refused
    When I log in as "locked_out_user" with password "tta_secret"
    Then I should see a login error containing "locked out"

  @negative
  Scenario: Wrong password is rejected
    When I log in as "standard_user" with password "wrong_password"
    Then I should see a login error containing "do not match"
