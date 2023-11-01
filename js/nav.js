"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */
$navSubmit.on("click", submitClick);

function submitClick(evt) {
  console.debug("submitClick", evt);
  hidePageComponents();
  $storyForm.show();
}

/** Show main list of all stories when click site name */

function navAllStories() {
  console.debug("navAllStories");
  hidePageComponents();
  putStoriesOnPage();
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */

function navLoginClick() {
  console.debug("navLoginClick");
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}

$navFavorites.on("click", navFavoritesClick)

/** clicking favorites tab only displays stories that are in the current user's favorites list
 * 
 */
function navFavoritesClick() {
  console.debug("navFavoritesClick")

  $allStoriesList.empty();

  // loop through all of our stories that match current user favorites and generate HTML for them
  for (let story of storyList.stories) {
    if (currentUser.favorites.find(e => e.storyId === story.storyId)) {
      const $story = generateStoryMarkup(story);
      $allStoriesList.append($story);
    }
  }
  $allStoriesList.show();

}

$navMy.on("click", navMyClick)

/** clicking my stories tab only displays stories in the current user's ownStories list
 * 
 */
function navMyClick() {
  console.debug("navMyClick")

  $allStoriesList.empty();
  // loop through all of our stories and generate HTML for them
  for (let story of currentUser.ownStories) {
    const $story = generateStoryMarkup(story);
    $($story).prepend("<i class='fas fa-trash-alt'></i>")
    $allStoriesList.append($story);
  }
  $allStoriesList.show();
}