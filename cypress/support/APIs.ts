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
   * Если директория существует, то она будет удалена
   * @param path - путь до директории
   * @param permanently - флаг полного удаления. True - удалить полностью. False - удалить в корзину
   * 
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
          url: `${this.config.baseUrl}/v1/disk/resources?path=${path}&permanently=${isPermanently}`,
          headers: this.credentialHeaders
        }).then(response => {
          expect(response.status).to.eq(204);
          cy.log(`Директория ${path} успешно удалена. Флаг permanently = ${isPermanently}`);
        })
      }
    })
    return this;
  }

  uploadFileViaUrl(path: string, url: string, timeoutSec: number) {
    cy.request({
      method: 'POST',
      url: `${this.config.baseUrl}/v1/disk/resources/upload?path=${path}&url=${url}`,
      headers: this.credentialHeaders
    }).then(response => {
      // Ассерт реализован как неявное цикличное ожидание успешного статуса загрузки потому что запрос возвращает ссылку на асинхронную операцию, а сайпрес такое не любит
      this.waitFileUploadStatus(response.body.href, 'success', timeoutSec);
    })
  }

  // Рекурсивное неявное ожидание статуса в теле запроса с таймером
  private waitFileUploadStatus(url: string, expectedResult: string, timeoutSec: number) {
    this.waitFileUploadStatusInt(url, expectedResult, 1, timeoutSec);
  }

  private waitFileUploadStatusInt (url: string, expectedResult: string, counter: number, timeoutSec: number) {
    if (counter > timeoutSec) {
      throw new Error(`Ожидаемый статус ${expectedResult} не получен`);
    }
    cy.request({
      method: 'GET',
      url: url,
      headers: this.credentialHeaders
    }).then(result => {
      if (expectedResult !== result.body.status) {
        cy.log(`Ждем статус ${expectedResult}. Итерация: ${counter}`);
        cy.log(`Текущий статус ${result.body.status}`);
        cy.wait(1000);
        this.waitFileUploadStatusInt(url, expectedResult, counter + 1, timeoutSec);
      } else {
        cy.log(`Найден статус ${result.body.status}`);
        return;
      }
    })
  }
}