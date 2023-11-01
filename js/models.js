"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** parses a the story object's string url into a url object then extracts and returns the hostname
   * @returns {string} only the hostname portion of a url
   * 
  */
  getHostName() {
    const urlObject = new URL(this.url)
    
    return urlObject.hostname
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */
  async addStory( user, newStory) {
    console.debug("addStory")
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "POST",
      data: {"token": user.loginToken, "story": {"author": newStory.author, "title": newStory.title, "url": newStory.url}}
    })
    const thisStory = response.data.story
    this.stories.push(thisStory)
    return thisStory
  }

  /** uses a storyId to retrieve the story object from story list and returns story object
   * 
   * @param {number} storyId story id to be searched
   * @returns {story} 
   */
  findStory(storyId) {
    for (let each of this.stories) {
      if (each.storyId == storyId) {
        return each
      }
    }
  }

  /** removes a given story from the api database
   * 
   * @param {number} storyId story id to be removed
   */
  async removeStory(storyId) {
    console.debug("removeStory")

    await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE", 
      data: {"token": currentUser.loginToken}
    })
  }
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }


  /** adds the given story to the current user's ownStories array
   * that way we dont have to send another request to the api in order to update the page
   * @param {story} story story object to be added
   */
  addMyStory(story) {
    currentUser.ownStories.push(story)
  }


  /** given story is added to current user's local favorites list as well as on the api database
   * 
   * @param {story} story story object to be favorited
   */
  async addFavorite(story) {
    currentUser.favorites.push(story)

    await axios({
      url: `${BASE_URL}/users/${currentUser.username}/favorites/${story.storyId}`,
      method: "POST",
      params: {"token": this.loginToken}
    })
  }


  /** given story is removed from current user's local favorites list as well as on the api database
   * 
   * @param {story} story story object to be removed from favorites
   */
  async removeFavorite(story) {
    currentUser.favorites = currentUser.favorites.filter(e => e.storyId != story.storyId)

    await axios({
      url: `${BASE_URL}/users/${currentUser.username}/favorites/${story.storyId}`,
      method: "DELETE",
      params: {"token": this.loginToken}
    })
  }

  /** removes given story from local current user ownStories list so that we dont have to make another call to the api in order to refresh the page
   * 
   * @param {number} storyId story id to be removed
   */
  removeMyStory(storyId) {
    currentUser.favorites = currentUser.favorites.filter(e => e.storyId != storyId)
  }
}
