import { YandexDiscApi, DogCeoApi } from "../support/APIs";

describe('Dogs spec', () => {

  const path = 'test_folder';
  const breeds = ['doberman', 'bulldog', 'collie'];
  const randomBreed = breeds[Math.floor(Math.random() * breeds.length)];

  before(() => {
    const yandexDiscApi = new YandexDiscApi();
    yandexDiscApi.deleteFolder(path)
      .createFolder(path);
  })

  it('Dogs test', () => {
    
    const yandexDiscApi = new YandexDiscApi();
    const dogCeoApi = new DogCeoApi();

    dogCeoApi.getSubBreeds(randomBreed).then(subBreeds => {
      if (subBreeds.length) {
        subBreeds.forEach((subBreed, index) => {
          dogCeoApi.getSubBreedRandomImageLink(randomBreed, subBreed).then(link => {
            yandexDiscApi.uploadFileViaUrl(`${path}/${subBreed}`, link, 20)
              .getFilesInFolder(path, 'created').then(items => {
                expect(items[index].name).to.eq(subBreed);
              })
          })
        }) 
      } else {
        dogCeoApi.getBreedRandomImageLink(randomBreed).then(link => {
          yandexDiscApi.uploadFileViaUrl(`${path}/${randomBreed}`, link, 20)
            .getFilesInFolder(path, 'created').then(items => {
              expect(items[0].name).to.eq(randomBreed);
            })
        })
      }
    })
  })

})