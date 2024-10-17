import { YandexDiscApi } from "../support/APIs";

describe('Dogs spec', () => {

  it('Dogs test', () => {
    const yandexDiscApi = new YandexDiscApi();
    yandexDiscApi.deleteFolder('ttr')
    .createFolder('ttr')
    .uploadFileViaUrl('ttr', 'https://dog.ceo/api/breeds/image/random/3', 10);
  })
  
})