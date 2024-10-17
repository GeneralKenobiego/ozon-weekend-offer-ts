import Chainable = Cypress.Chainable

// Описание формата конфига для апи яндекса
interface yandexConfig {
  baseUrl: string,
  token: string;
}

export class YandexDiscApi {
  private readonly config: yandexConfig;
  private readonly credentialHeaders: {};

  // Конфигурирование через конструктор. Если не передать конфиг при создании объекта, то он будет взят из Cypress.env('yandexDiscConf')
  constructor (config?: yandexConfig) {
    const defaultConf = Cypress.env('yandexDiscConf');
    this.config = {...defaultConf, ...config};
    this.credentialHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `OAuth ${this.config.token}`
    }
  }

  /**
   * Создает директорию
   * @param path - путь до директории
  **/
  createFolder(path: string) { 
    cy.request({
      method: 'PUT',
      url: `${this.config.baseUrl}/v1/disk/resources?path=${path}`,
      headers: this.credentialHeaders
    }).then(response => {
      expect(response.status).to.eq(201);
      cy.log(`Директория ${path} успешно создана`);
    })
    return this;
  }

  /**
   * Возвращает метаданные указанной директории и файлов в ней
   * @param path - путь до директории
   * @param sortBy - поле для сортировки
  **/
  getFilesInFolder(path: string, sortBy: string) : Chainable<any[]> {
    return cy.request({
      method: 'GET',
      url: `${this.config.baseUrl}/v1/disk/resources?path=${path}&sort=${sortBy}`,
      headers: this.credentialHeaders
    }).then(response => {
      expect(response.status).to.eq(200);
      return response.body._embedded.items;
    })
  }

  /**
   * Удаление директории если она существует
   * @param path - путь до директории
   * @param permanently - флаг полного удаления. True - удалить полностью. False - удалить в корзину
  **/
  deleteFolder(path: string, permanently?: boolean) {
    const isPermanently = permanently || true;
    // Проверяем существует ли директория
    cy.request({
      method: 'GET',
      url: `${this.config.baseUrl}/v1/disk/resources?path=${path}`,
      headers: this.credentialHeaders,
      failOnStatusCode: false
    }).then(response => {
      if (response.status === 200) {
        cy.request({
          method: 'DELETE',
          url: `${this.config.baseUrl}/v1/disk/resources?path=${path}&force_async=true&permanently=${isPermanently}`,
          headers: this.credentialHeaders
        }).then(response => {
          expect(response.status).to.eq(202);
          this.waitOperationStatus(response.body.href, 'success', 30);
          cy.log(`Директория ${path} успешно удалена. Флаг permanently = ${isPermanently}`);
        })
      }
    })
    return this;
  }

  /**
   * Загрузка файла из указанной ссылки
   * @param path - путь до директории + имя создаваемого файла
   * @param url - адрес загружаемого файла
   * @param timeoutSec - кол-во попыток\максимальное время ожидания статуса
  **/
  uploadFileViaUrl(path: string, url: string, timeoutSec: number) {
    cy.request({
      method: 'POST',
      url: `${this.config.baseUrl}/v1/disk/resources/upload?path=${path}&url=${url}`,
      headers: this.credentialHeaders
    }).then(response => {
      // Ассерт реализован как неявное цикличное ожидание успешного статуса потому что запрос возвращает ссылку на асинхронную операцию, а сайпрес такое не любит
      this.waitOperationStatus(response.body.href, 'success', timeoutSec);
    })
    return this;
  }

  /**
   * Рекурсивное неявное ожидание статуса асинхронной операции с таймером
   * @param url - ссылку на асинхронную операцию
   * @param expectedResult - ожидаемый статус
   * @param timeoutSec - кол-во попыток\максимальное время ожидания статуса
  **/
  private waitOperationStatus(url: string, expectedResult: string, timeoutSec: number) {
    this.waitOperationStatusInt(url, expectedResult, 1, timeoutSec);
  }

  private waitOperationStatusInt (url: string, expectedResult: string, counter: number, timeoutSec: number) {
    if (counter > timeoutSec) {
      throw new Error(`Ожидаемый статус ${expectedResult} не получен`);
    }
    cy.request({
      method: 'GET',
      url: url,
      headers: this.credentialHeaders
    }).then(response => {
      if (expectedResult !== response.body.status) {
        cy.log(`Ждем статус ${expectedResult}. Итерация: ${counter}`);
        cy.log(`Текущий статус ${response.body.status}`);
        cy.wait(1000);
        this.waitOperationStatusInt(url, expectedResult, counter + 1, timeoutSec);
      } else {
        cy.log(`Найден статус ${response.body.status}`);
        return;
      }
    })
  }

}

export class DogCeoApi {

  /**
   * Возвращает массив подпород
   * @param breed - порода
  **/
  getSubBreeds(breed: string) : Chainable<string[]> {
    return cy.request({
      method: 'GET',
      url: `/api/breed/${breed}/list`
    }).then(response => {
      expect(response.status).to.eq(200);
      return response.body.message;
    })
  }

  /**
   * Возвращает ссылку на рандомное фото подпороды
   * @param breed - порода
   * @param subBreed - подпорода
  **/
  getSubBreedRandomImageLink(breed: string, subBreed: string) : Chainable<string> {
    return cy.request({
      method: 'GET',
      url: `/api/breed/${breed}/${subBreed}/images/random`
    }).then(response => {
      expect(response.status).to.eq(200);
      return response.body.message;
    })
  }

  /**
   * Возвращает ссылку на рандомное фото породы
   * @param breed - порода
  **/
  getBreedRandomImageLink(breed: string) : Chainable<string> {
    return cy.request({
      method: 'GET',
      url: `/api/breed/${breed}/images/random`
    }).then(response => {
      expect(response.status).to.eq(200);
      return response.body.message;
    })
  }

}