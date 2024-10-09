"use strict";

const questions_container = document.getElementById('questions_container');
const questions = JSON.parse(localStorage.getItem('questions')) || {};

let searchTerm = '';
let isFavorite = false;

function printQuestions() {
	questions_container.innerHTML = ''; // Clear previous content
	for (const questionId in questions) {
		printQuestion(questionId); // Print each question
	}

	// Add event listener for clicks on the questions_container
	questions_container.addEventListener('click', (event) => {
		const questionDiv = event.target.closest('.questions');
		if (questionDiv) {
			const questionId = questionDiv.id.split('-')[1]; // Get the ID from the question div
			handleQuestionClick(questionDiv);

			const responseSection = document.getElementById('selectedQuestion');
			responseSection.textContent = ''; // Clear previous responses
			const questionResponse = document.createElement('div');
			questionResponse.classList.add('response-section');

			const question_obj = questions[questionId];
			const formattedQuestion = question_obj.question.replace(/\n{2,}/g, '<br>').replace(/\n/g, '<br>');

			questionResponse.innerHTML = `
                <h4>Question</h4>
                <div class="bg_greyish p-2" style="height: 100px; overflow-y: auto;">
                    <h3>${question_obj.subject}</h3>
                    <p>${formattedQuestion}</p>
                </div>
                <div class="mt-3 text-end">
                    <input class="btn btn-primary" type="button" value="Remove" onclick="handleRemoveQuestion(${questionId})">
                </div>
                <h4 class="mt-4">Response</h4>
                <div class="responses" id="response_container">
                    ${generateResponsesHtml(question_obj.responses, questionId)}
                </div>
                <h4 class="mt-4">Add Response</h4>
                <form onsubmit="handleAddResponse(event, ${questionId})" class="mt-2">
                    <input type="text" name="respName" class="form-control w-50" placeholder="Enter Name" required>
                    <div class="form-floating mt-3">
                        <textarea class="form-control" placeholder="" name="responseText" style="height: 150px" required></textarea>
                        <label for="floatingTextarea">Response</label>
                    </div>
                    <div class="mt-3 text-end">
                        <input class="btn btn-primary" type="submit" value="Submit">
                    </div>
                </form>
            `;
			responseSection.append(questionResponse); // Append question response section
		}
	});
}
printQuestions(); // Initial call to print questions

function printQuestion(questionId) {
	const question_obj = questions[questionId];
	const question_div = document.createElement('div');
	question_div.classList.add('questions');
	question_div.id = `question-${questionId}`; // Assign an ID based on questionId

	// Highlight the search term in both subject and question text
	const subjectWithHighlight = highlightText(question_obj.subject, searchTerm);
	const formattedQuestion = question_obj.question.replace(/\n{2,}/g, '<br>').replace(/\n/g, '<br>');
	const questionWithHighlight = highlightText(formattedQuestion, searchTerm);
	const timeAdded = timeSince(question_obj.timestamp); // Get the formatted time

	// question_div.innerHTML = `<div><h3>${subjectWithHighlight}</h3><p>${questionWithHighlight}</p></div>
	// <i class="fa-regular fa-star text-warning fs-3" ></i>`;
	question_div.innerHTML = `
		<div>
			<h3>${subjectWithHighlight}</h3>
			<p class=''>${questionWithHighlight}</p>
            <small>${timeAdded}</small> <!-- Display the time added -->
		</div>
		<i class="${question_obj.favorite ? 'fa-solid' : 'fa-regular'} fa-star text-warning fs-2" id="star-icon-${questionId}"></i>
		`;

	// Insert question at the top of the questions container
	if (questions_container.firstChild) {
		questions_container.insertBefore(question_div, questions_container.firstChild);
	} else {
		questions_container.appendChild(question_div);
	}

	const starIcon = document.getElementById(`star-icon-${questionId}`);
	starIcon.addEventListener('click', (e) => {
		e.stopPropagation(); // Prevent click event from bubbling up to the question div
		question_obj.favorite = !question_obj.favorite;
		starIcon.classList.toggle('fa-regular');
		starIcon.classList.toggle('fa-solid');
		localStorage.setItem('questions', JSON.stringify(questions));
	});
}

function generateResponseHtml(response, questionId, index) {
	return `
			<div class="bg_greyish p-2 mt-2 d-flex justify-content-between align-items-center" id="response-${index}" data-question-id="${questionId}">
					<div>
							<h3>${response.name}</h3>
							<p>${response.text}</p>
					</div>
					<div class="">
							<div class="d-flex justify-content-between align-items-center gap-3">
									<div class="pointer border border-2 rounded border-dark px-2 text-center fw-bold btn btn-outline-dark btn-upvote fs-6 lh-1" onclick="handleVote(${questionId}, ${index}, 'upvote')">+</div>
									<div class="vote-count vote-count-up">${response.upvotes || 0}</div>
							</div>
							<div class="d-flex justify-content-between align-items-center gap-3 mt-2">
									<div class="pointer border border-2 rounded border-dark px-2 text-center fw-bold btn btn-outline-dark btn-downvote fs-6 w-100 lh-1" onclick="handleVote(${questionId}, ${index}, 'downvote')">-</div>
									<div class="vote-count vote-count-down">${response.downvotes || 0}</div>
							</div>
					</div>
			</div>
	`;
}

// Function to generate HTML for all responses
function generateResponsesHtml(responses, questionId) {
	if (!responses || responses.length === 0) {
		return `<p>No responses yet.</p>`; // No responses message
	}
	// Sort responses based on upvotes and downvotes
	responses.sort((a, b) => (b.upvotes || 0) - (b.downvotes || 0) - ((a.upvotes || 0) - (a.downvotes || 0)));
	return responses.map((response, index) => generateResponseHtml(response, questionId, index)).join(''); // Map to HTML
}

// Function to handle adding a response
function handleAddResponse(event, questionId) {
	event.preventDefault(); // Prevent form submission
	const formData = new FormData(event.target);
	const name = formData.get('respName').trim();
	const responseText = formData.get('responseText').trim();

	if (!name || !responseText) {
		alert("Fill All Fields");
		return; // Ensure both fields are filled
	}

	// Initialize responses array if it doesn't exist
	if (!questions[questionId].responses) {
		questions[questionId].responses = [];
	}
	questions[questionId].responses.push({ name, text: responseText, upvotes: 0, downvotes: 0 });
	localStorage.setItem('questions', JSON.stringify(questions)); // Update localStorage
	const responsesContainer = document.getElementById('response_container');
	responsesContainer.innerHTML = generateResponsesHtml(questions[questionId].responses, questionId); // Refresh responses
	event.target.reset(); // Reset the form
}

// Function to handle submitting a new question
function handleSubmit(event) {
	event.preventDefault(); // Prevent form submissiofloatingTextarean
	const subject = document.getElementById('questionSub').value.trim();
	const question = document.getElementById('floatingTextarea').value.trim();
	if (!subject || !question) {
		alert("Fill All Fields");
		return; // Ensure both fields are filled
	}

	const maxId = Math.max(...Object.keys(questions).map(Number), 0); // Find the maximum ID
	const nextId = maxId + 1; // Increment to get the next ID
	questions[nextId] =
	{
		id: nextId,
		subject,
		question,
		favorite: false,
		timestamp: new Date().toISOString() // Add timestamp
	}; // Add new question
	localStorage.setItem('questions', JSON.stringify(questions)); // Update localStorage
	printQuestion(nextId); // Print the new question
	event.target.reset(); // Reset the form
}

// Function to handle showing the new question form
function handleNewQuestionForm() {
	const form_div = document.getElementById('addNewQues');
	const response_div = document.getElementById('selectedQuestion');
	if (form_div.classList.contains('d-none')) {
		form_div.classList.remove('d-none'); // Show the form if hidden
	}
	response_div.classList.add('d-none'); // Hide responses
	const allQuestions = document.querySelectorAll('.questions');
	allQuestions.forEach(div => div.classList.remove('selected')); // Deselect all questions
	const questionSub = document.getElementById('questionSub');
	questionSub.focus();
}

// Function to handle clicking on a question
function handleQuestionClick(question_div) {
	const form_div = document.getElementById('addNewQues');
	const response_div = document.getElementById('selectedQuestion');
	const allQuestions = document.querySelectorAll('.questions');
	allQuestions.forEach(div => div.classList.remove('selected')); // Deselect all questions
	question_div.classList.add('selected'); // Highlight selected question
	if (response_div.classList.contains('d-none')) {
		form_div.classList.add('d-none'); // Hide the form
		response_div.classList.remove('d-none'); // Show the response section
	}
}

// Delete the Question
function handleRemoveQuestion(questionId) {
	// Remove the question from the questions object
	delete questions[questionId];

	// Update localStorage
	localStorage.setItem('questions', JSON.stringify(questions));

	// Remove the question div from the DOM using the ID
	const questionDiv = document.getElementById(`question-${questionId}`);
	// console.log(questionId, questionDiv);
	if (questionDiv) {
		questions_container.removeChild(questionDiv);
	}
	handleNewQuestionForm();
}

function highlightText(text, searchTerm) {
	if (!searchTerm) return text; // Return the original text if no search term

	// Escape special regex characters in the search term
	const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	// console.log(escapedSearchTerm);

	const regex = new RegExp(`(${escapedSearchTerm})`, 'gi'); // Create a regex to find the search term (case insensitive)
	return text.replace(regex, '<span class="highlight">$1</span>'); // Wrap the search term in a span
}


// Function to swap DOM elements when responses are swapped in the array
function swapDOMElements(index1, index2) {
	const response1 = document.getElementById(`response-${index1}`);
	const response2 = document.getElementById(`response-${index2}`);

	if (response1 && response2) {
		const parent = response1.parentNode;

		// Insert response2 before response1, or response1 before response2
		if (index1 < index2) {
			parent.insertBefore(response2, response1); // Move response2 before response1
		} else {
			parent.insertBefore(response1, response2); // Move response1 before response2
		}

		// Swap their IDs to reflect the new indices
		response1.id = `response-${index2}`;
		response2.id = `response-${index1}`;

		// Now, update the inner elements like upvote/downvote button event listeners and IDs
		updateVoteButtons(response1, index2);
		updateVoteButtons(response2, index1);
	}
}

// Function to update the event listeners and IDs after swapping
function updateVoteButtons(responseDiv, newIndex) {
	// Update the upvote button
	const upvoteButton = responseDiv.querySelector('.btn-upvote');
	const questionId = responseDiv.getAttribute('data-question-id');
	upvoteButton.setAttribute('onclick', `handleVote(${questionId}, ${newIndex}, 'upvote')`);

	// Update the downvote button
	const downvoteButton = responseDiv.querySelector('.btn-downvote');
	downvoteButton.setAttribute('onclick', `handleVote(${questionId}, ${newIndex}, 'downvote')`);
}

// Function to swap responses in the array based on score and return the new swap index
function swapWithNeighbor(responses, index) {
	const currentScore = (responses[index].upvotes || 0) - (responses[index].downvotes || 0);

	let swapIndex = index;

	// Traverse backwards to find the correct swap position (if score increases)
	for (let i = index - 1; i >= 0; i--) {
		const prevScore = (responses[i].upvotes || 0) - (responses[i].downvotes || 0);
		if (currentScore > prevScore) {
			swapIndex = i; // Found a lower-scoring response, mark it for swapping
		} else {
			break; // Stop when the current response score is no longer greater
		}
	}

	// Perform the swap if necessary (for higher positions)
	if (swapIndex !== index) {
		const [movedResponse] = responses.splice(index, 1);
		responses.splice(swapIndex, 0, movedResponse); // Insert at the new position
	}

	// Traverse forwards to find the correct swap position (if score decreases)
	for (let i = index + 1; i < responses.length; i++) {
		const nextScore = (responses[i].upvotes || 0) - (responses[i].downvotes || 0);
		if (currentScore < nextScore) {
			swapIndex = i; // Found a higher-scoring response, mark it for swapping
		} else {
			break; // Stop when the current response score is no longer lower
		}
	}

	// Perform the swap if necessary (for lower positions)
	if (swapIndex !== index) {
		const [movedResponse] = responses.splice(index, 1);
		responses.splice(swapIndex, 0, movedResponse); // Insert at the new position
	}

	return swapIndex;
}

function handleVote(questionId, responseIndex, action) {
	const response = questions[questionId].responses[responseIndex];
	if (action === 'upvote') {
		response.upvotes = (response.upvotes || 0) + 1; // Increment upvotes
	} else if (action === 'downvote') {
		response.downvotes = (response.downvotes || 0) + 1; // Increment downvotes
	}

	// Swap responses based on scores
	const newSwapIndex = swapWithNeighbor(questions[questionId].responses, responseIndex);

	// If the response was swapped, update the DOM as well
	if (newSwapIndex !== responseIndex) {
		swapDOMElements(responseIndex, newSwapIndex);
	}

	// Update localStorage
	localStorage.setItem('questions', JSON.stringify(questions));

	// Refresh the responses to reflect updated vote counts
	const responsesContainer = document.getElementById('response_container');
	responsesContainer.innerHTML = generateResponsesHtml(questions[questionId].responses, questionId);
}

document.addEventListener('keydown', (event) => {
	// Check if the key combination is Alt + S
	if (event.ctrlKey && event.key === 'k') {
		event.preventDefault(); // Prevent the default action (if any)
		const searchbtn = document.getElementById('searchbtn');
		searchbtn.focus(); // Focus on the search input
	}
});


function handleSearch(event) {
	searchTerm = event.target.value.toLowerCase().trim();
	const questionDivs = document.querySelectorAll('.questions');

	questionDivs.forEach(div => {
		const questionText = div.textContent.toLowerCase(); // Get the text content of the div
		if (questionText.includes(searchTerm)) {
			if (div.classList.contains('d-none')) {
				div.classList.remove('d-none'); // Show the div if it matches the search term
			}
			const subject = div.querySelector('h3').textContent; // Get subject text
			const question = div.querySelector('p').textContent; // Get question text

			// Highlight the search term
			div.innerHTML = `
				<div>
					<h3>${highlightText(subject, searchTerm)}</h3>
					<p>${highlightText(question, searchTerm)}</p>
				</div>
			`;
		} else {
			div.classList.add('d-none'); // Hide the div if it doesn't match
		}
	});
}

function handleFavourites() {
	const questionDivs = document.querySelectorAll('.questions');
	const favoriteBtn = document.getElementById('favoriteBtn');

	if (!isFavorite) {
		favoriteBtn.classList.add('btn-primary');
		favoriteBtn.classList.add('text-white');
		isFavorite = true;
		questionDivs.forEach(div => {
			const div_id = div.id.split('-')[1];
			// console.log(div_id);
			if (!questions[div_id].favorite) {
				div.classList.add('d-none');
			}
		});
	} else {
		favoriteBtn.classList.remove('btn-primary');
		favoriteBtn.classList.remove('text-white');
		isFavorite = false;
		questionDivs.forEach(div => {
			div.classList.remove('d-none');
		});
	}
}

function timeSince(date) {
	const seconds = Math.floor((new Date() - new Date(date)) / 1000);
	let interval = Math.floor(seconds / 31536000);
	if (interval > 1) return interval + " years ago";
	interval = Math.floor(seconds / 2592000);
	if (interval > 1) return interval + " months ago";
	interval = Math.floor(seconds / 86400);
	if (interval > 1) return interval + " days ago";
	interval = Math.floor(seconds / 3600);
	if (interval > 1) return interval + " hours ago";
	interval = Math.floor(seconds / 60);
	if (interval > 1) return interval + " minutes ago";
	return "just now";
}

function updateTimes() {
	const questionDivs = document.querySelectorAll('.questions');
	questionDivs.forEach(div => {
		const questionId = div.id.split('-')[1];
		// console.log(questionId);
		const question_obj = questions[questionId];
		const timeElement = div.querySelector('small'); // Select the time element
		if (timeElement) {
			timeElement.textContent = timeSince(question_obj.timestamp); // Update time
		}
	});
}

setInterval(updateTimes, 60000);