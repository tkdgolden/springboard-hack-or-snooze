"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  console.debug("generateStoryMarkup");

  const hostName = story.getHostName();

  // separate logic for if the star should be filled if it is in the current user's favorites list
  if(currentUser) {
    if (currentUser.favorites.find(e => e.storyId === story.storyId)) {
      return $(`
        <li id="${story.storyId}">
          <i class="fas fa-star"></i>
          <a href="${story.url}" target="a_blank" class="story-link">${story.title}</a>
          <small class="story-hostname">(${hostName})</small><br>
          <small class="story-author">by ${story.author}</small><br>
          <small class="story-user">posted by ${story.username}</small>
        </li>
      `)
    }
  }
  
  return $(`
      <li id="${story.storyId}">
        <i class="far fa-star"></i>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small><br>
        <small class="story-author">by ${story.author}</small><br>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

async function putStoriesOnPage() {
  storyList = await StoryList.getStories();

  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }
  $allStoriesList.show();
}


$storyForm.on("submit", submitStory)


/** completed submit story form creates a story object, pushes the object to the current user's ownstories list locally and on the api, then refreshes the page to show the updated story list
 * 
 */
async function submitStory() {
  console.debug("submitStory")
  const author = $("#author").val()
  const title = $("#title").val()
  const url = $("#url").val()
  const thisStory = await storyList.addStory(currentUser, { title, author, url })
  currentUser.addMyStory(await thisStory)
  putStoriesOnPage()

  $storyForm.hide()
}

$allStoriesList.on("click", ".fa-star", toggleFavorite)

/** when a star is clicked, either add or remove the indicated story from favorite list and toggle the star
 * 
 * @param {event} evt object of click event, contains the element that was clicked on
 */
function toggleFavorite(evt) {
  const storyId = evt.target.parentElement.id
  const story = storyList.findStory(storyId)
  if (currentUser.favorites.find(e => e.storyId === story.storyId)) {
    currentUser.removeFavorite(story)
  } else {
    currentUser.addFavorite(story)
  }
  $(evt.target).toggleClass("far fas")
}

$allStoriesList.on("click", ".fa-trash-alt", remove)


/** when a trash can is clicked, remove the indicated story from the api, the current user's local ownstories list, and remove the element from the dom
 * 
 * @param {event} evt object of click event, contains the element that was clicked on
 */
async function remove(evt) {
  const storyId = evt.target.parentElement.id
  storyList.removeStory(storyId)
  currentUser.removeMyStory(storyId)
  $(evt.target.parentElement).remove()
}