import './css/styles.css';
import Notiflix from 'notiflix';
import ImagesApi from './ImagesApi.js';
import LoadMoreBtn from './LoadMoreBtn';
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";

const searchFormEl = document.getElementById("search-form");
const inputEl = document.querySelector("input");
const loadMoreBtn = new LoadMoreBtn({
    selector: ".load-more",
    isHidden: true,
});
const imagesApi = new ImagesApi();
const galleryEl = document.querySelector('.gallery');
let gallery = new SimpleLightbox('.gallery a', {
        captions: true,
        captionsData: "alt",
        captionDelay: 250,
        scrollZoom: false
});

galleryEl.addEventListener('click', onImgClick);

function onImgClick(event) {
    event.preventDefault();
    if (event.target.nodeName !== "IMG") {
        return;
    }
};

searchFormEl.addEventListener("submit", onSubmit);

function onSubmit(e) {
    e.preventDefault();
    imagesApi.searchQuery = inputEl.value.trim();
    clearImagesDiv();
    imagesApi.resetPage();
    loadMoreBtn.show();
    fetchImages();
};

function createMarkupForAllImages(images) {
    let markupForAllImages = "";
    for (let image of images) {
        markupForAllImages += createImagesMarkup(image);
    } 

    return markupForAllImages;
};

function createImagesMarkup({ webformatURL, largeImageURL, tags, likes, views, comments, downloads }) {
    return `
        <div class="photo-card">
        <a class="gallery__item" href="${largeImageURL}">
            <img src="${webformatURL}" alt="${tags}" loading="lazy" />
        </a>
            <div class="info">
                <p class="info-item">
                    <b>Likes: ${likes}</b>
                </p>
                <p class="info-item">
                    <b>Views: ${views}</b>
                </p>
                <p class="info-item">
                    <b>Comments: ${comments}</b>
                </p>
                <p class="info-item">
                    <b>Downloads: ${downloads}</b>
                </p>
            </div>
        </div>
    `
};

function clearImagesDiv() {
    document.querySelector(".gallery").innerHTML = "";
}

function createImagesDiv(markup) {
    document.querySelector(".gallery").insertAdjacentHTML("beforeend", markup);
    gallery.refresh();
}

function onError(err) {
    console.error(err);
    Notiflix.Notify.failure('Sorry, there are no images matching your search query. Please try again.');
    loadMoreBtn.hide();
};

loadMoreBtn.button.addEventListener("click", fetchImages);


async function fetchImages() {
    loadMoreBtn.disable();
    imagesApi.searchQuery = inputEl.value.trim();
    try {
        if (imagesApi.searchQuery === "") {
            loadMoreBtn.hide();
            return;
            
        };
        const images = await imagesApi.getImages();
        let pageCount = Math.ceil(imagesApi.totalHits / imagesApi.imagesPerPage);
        if (images.length === 0) {
            throw new Error("No data");
        } else if (images.length < imagesApi.imagesPerPage) {
            createImagesDiv(createMarkupForAllImages(images));
            Notiflix.Notify.warning("We're sorry, but you've reached the end of search results.");
            loadMoreBtn.hide();
            
        } else if (imagesApi.totalHits !== null && pageCount < imagesApi.queryPage) {
            Notiflix.Notify.warning("We're sorry, but you've reached the end of search results.");
            loadMoreBtn.hide();
        } else {
            createImagesDiv(createMarkupForAllImages(images));
            loadMoreBtn.enable();
            imagesApi.incrementPage();

        }
    } catch (err) {
        onError(err);
    }
};
