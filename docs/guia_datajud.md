# Guia Completo da API Pública do Datajud

## Acesso à API Pública do Datajud

A API Pública do Datajud é uma ferramenta que disponibiliza ao público o acesso aos metadados dos processos públicos dos tribunais do judiciário brasileiro. Os dados disponibilizados pela API são de origem da Base Nacional de Dados do Poder Judiciário – Datajud e atendem aos critérios estabelecidos na Portaria Nº 160 de 09/09/2020.

## API Key

A autenticação da API Pública do Datajud é realizada através de uma Chave Pública, gerada e disponibilizada pelo DPJ/CNJ. A chave vigente estará sempre acessível nesta seção da Wiki, garantindo transparência e facilitando seu acesso. Importante ressaltar que, por razões de segurança e gestão do sistema, a chave poderá ser alterada pelo CNJ a qualquer momento.

Para incorporar a API Key em suas requisições, utilize o formato `Authorization: APIKey [Chave Pública]` no cabeçalho da requisição.

**APIKey atual:** `Authorization: APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==`

## Exemplos de Consulta

### Ex. 1 - Pesquisar pelo número de processo

No exemplo abaixo é realizada a consulta de um processo judicial utilizando a numeração única do processo como parâmetro de pesquisa no tribunal do TRF1.

**Endpoint:** `POST /api_publica_tribunal/_search`

**Instruções (Postman):**

1.  Abra o Postman e clique em "New Request".
2.  Defina o método HTTP como `POST`.
3.  Digite a URL: `https://api-publica.datajud.cnj.jus.br/api_publica_trf1/_search`
4.  Selecione a aba "Headers" e inclua a chave `Authorization` com o valor `APIKey [Chave Pública]`.
5.  Ainda em "Headers" inclua a chave `Content-Type` com o valor `application/json`.
6.  Selecione a aba "Body" e escolha a opção "raw".
7.  Insira o corpo da solicitação JSON conforme o exemplo abaixo:

```json
{
  "query": {
    "match": {
      "numeroProcesso": "00008323520184013202"
    }
  }
}
```

8.  Clique em "Send" para enviar e aguarde a resposta da API.

**Resposta Esperada:**

A resposta esperada é um JSON com os metadados de 1 ou mais processos conforme o critério da busca:

```json
{
  "took": 6679,
  "timed_out": false,
  "_shards": {
    "total": 7,
    "successful": 7,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 1,
      "relation": "eq"
    },
    "max_score": 13.917725,
    "hits": [
      {
        "_index": "api_publica_trf1",
        "_type": "_doc",
        "_id": "TRF1_436_JE_16403_00008323520184013202",
        "_score": 13.917725,
        "_source": {
          "numeroProcesso": "00008323520184013202",
          "classe": {
            "codigo": 436,
            "nome": "Procedimento do Juizado Especial Cível"
          },
          "sistema": {
            "codigo": 1,
            "nome": "Pje"
          },
          "formato": {
            "codigo": 1,
            "nome": "Eletrônico"
          },
          "tribunal": "TRF1",
          "dataHoraUltimaAtualizacao": "2023-07-21T19:10:08.483Z",
          "grau": "JE",
          "@timestamp": "2023-08-14T11:50:51.994Z",
          "dataAjuizamento": "2018-10-29T00:00:00.000Z",
          "movimentos": [
            {
              "complementosTabelados": [
                {
                  "codigo": 2,
                  "valor": 1,
                  "nome": "competência exclusiva",
                  "descricao": "tipo_de_distribuicao_redistribuicao"
                }
              ],
              "codigo": 26,
              "nome": "Distribuição",
              "dataHora": "2018-10-30T14:06:24.000Z"
            },
            {
              "codigo": 14732,
              "nome": "Conversão de Autos Físicos em Eletrônicos",
              "dataHora": "2020-08-05T01:15:18.000Z"
            }
          ],
          "id": "TRF1_436_JE_16403_00008323520184013202",
          "nivelSigilo": 0,
          "orgaoJulgador": {
            "codigoMunicipioIBGE": 5128,
            "codigo": 16403,
            "nome": "JEF Adj - Tefé"
          },
          "assuntos": [
            {
              "codigo": 6177,
              "nome": "Concessão"
            }
          ]
        }
      }
    ]
  }
}
```

### Ex. 2 - Pesquisar por Classe Processual e Órgão Julgador

No exemplo abaixo é realizada a consulta de processos que possuam a Classe Processual 1116 – "Execução Fiscal" do Órgão Julgador 13597 - VARA DE EXECUÇÃO FISCAL DO DF no tribunal TJDFT.

**Endpoint:** `POST /api_publica_tribunal/_search`

**Instruções (Postman):**

1.  Abra o Postman e clique em "New Request".
2.  Defina o método HTTP como `POST`.
3.  Digite a URL: `https://api-publica.datajud.cnj.jus.br/api_publica_tjdft/_search`
4.  Selecione a aba "Headers" e inclua a chave `Authorization` com o valor `APIKey [Chave Pública]`.
5.  Ainda em "Headers" inclua a chave `Content-Type` com o valor `application/json`.
6.  Selecione a aba "Body" e escolha a opção "raw".
7.  Insira o corpo da solicitação JSON conforme o exemplo abaixo:

```json
{
  "query": {
    "bool": {
      "must": [
        {"match": {"classe.codigo": 1116}},
        {"match": {"orgaoJulgador.codigo": 13597}}
      ]
    }
  }
}
```

8.  Clique em "Send" para enviar e aguarde a resposta da API.

**Resposta Esperada:**

A resposta esperada é um JSON com os metadados de 1 ou mais processos conforme o critério da busca:

```json
{
  "took": 213,
  "timed_out": false,
  "_shards": {
    "total": 3,
    "successful": 3,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 10000,
      "relation": "gte"
    },
    "max_score": 2.0,
    "hits": [
      {
        "_index": "api_publica_tjdft",
        "_type": "_doc",
        "_id": "TJDFT_1116_G1_13597_07223914020178070001",
        "_score": 2.0,
        "_source": {
          "classe": {
            "codigo": 1116,
            "nome": "Execução Fiscal"
          },
          "numeroProcesso": "07223914020178070001",
          "sistema": {
            "codigo": 1,
            "nome": "Pje"
          },
          "formato": {
            "codigo": 1,
            "nome": "Eletrônico"
          },
          "tribunal": "TJDFT",
          "dataHoraUltimaAtualizacao": "2022-09-06T12:03:20.257Z",
          "grau": "G1",
          "@timestamp": "2023-04-13T17:59:46.214Z",
          "dataAjuizamento": "2017-08-21T10:05:32.000Z",
          "movimentos": [
            {
              "complementosTabelados": [
                {
                  "codigo": 2,
                  "valor": 2,
                  "nome": "sorteio",
                  "descricao": "tipo_de_distribuicao_redistribuicao"
                }
              ],
              "codigo": 26,
              "nome": "Distribuição",
              "dataHora": "2017-08-21T10:05:32.000Z"
            },
            {
              "codigo": 11382,
              "nome": "Bloqueio/penhora on line",
              "dataHora": "2022-07-13T07:25:59.000Z"
            },
            {
              "codigo": 132,
              "nome": "Recebimento",
              "dataHora": "2022-07-13T07:26:00.000Z"
            }
          ],
          "id": "TJDFT_1116_G1_13597_07223914020178070001",
          "nivelSigilo": 0,
          "orgaoJulgador": {
            "codigoMunicipioIBGE": 5300108,
            "codigo": 13597,
            "nome": "VARA DE EXECU??O FISCAL DO DF"
          },
          "assuntos": [
            [
              {
                "codigo": 6017,
                "nome": "Dívida Ativa (Execução Fiscal)"
              }
            ]
          ]
        }
      },
      {
        "_index": "api_publica_tjdft",
        "_type": "_doc",
        "_id": "TJDFT_1116_G1_13597_00073039720138070015",
        "_score": 2.0,
        "_source": {
          "classe": {
            "codigo": 1116,
            "nome": "Execução Fiscal"
          },
          "numeroProcesso": "00073039720138070015",
          "sistema": {
            "codigo": 1,
            "nome": "Pje"
          },
          "formato": {
            "codigo": 1,
            "nome": "Eletrônico"
          },
          "tribunal": "TJDFT",
          "dataHoraUltimaAtualizacao": "2022-09-06T17:26:23.938Z",
          "grau": "G1",
          "@timestamp": "2023-04-13T18:02:23.754Z",
          "dataAjuizamento": "2019-05-30T03:17:56.000Z",
          "movimentos": [
            {
              "complementosTabelados": [
                {
                  "codigo": 2,
                  "valor": 1,
                  "nome": "competência exclusiva",
                  "descricao": "tipo_de_distribuicao_redistribuicao"
                }
              ],
              "codigo": 26,
              "nome": "Distribuição",
              "dataHora": "2013-02-18T13:17:23.000Z"
            },
            {
              "codigo": 245,
              "nome": "Provisório",
              "dataHora": "2019-05-30T11:10:02.000Z"
            }
          ],
          "id": "TJDFT_1116_G1_13597_00073039720138070015",
          "nivelSigilo": 0,
          "orgaoJulgador": {
            "codigoMunicipioIBGE": 5300108,
            "codigo": 13597,
            "nome": "VARA DE EXECU??O FISCAL DO DF"
          },
          "assuntos": [
            [
              {
                "codigo": 6017,
                "nome": "Dívida Ativa (Execução Fiscal)"
              }
            ],
            [
              {
                "codigo": 10394,
                "nome": "Dívida Ativa não-tributária"
              }
            ]
          ]
        }
      }
    ]
  }
}
```

### Ex. 3 - Pesquisa com paginação (search_after)

Por padrão, as pesquisas na API do Elasticsearch retornam até 10 registros por solicitação. No entanto, é possível aumentar o número de registros retornados utilizando o parâmetro `size` de paginação dos registros. Esse parâmetro permite especificar quantos resultados devem ser retornados por página, variando de 10 até 10.000 registros por página.

Quando se tem uma necessidade de percorrer uma maior quantidade de resultados, é possível fazer uso do recurso `search_after`. Esse recurso é prioritariamente recomendado para paginação de dados, pois permite que a API do Datajud continue a partir do ponto onde a última página parou, sem a necessidade de recarregar todos os resultados a cada nova página.

O `search_after` é um ponteiro que aponta para o último registro retornado na página anterior e pode ser informado como parâmetro para a próxima solicitação, permitindo que a API retorne os resultados seguintes.

É importante ressaltar que a utilização do `search_after` não prejudica a performance da API na busca de grandes volumes de dados, pois permite que a API do Datajud execute consultas de forma mais eficiente, sem a necessidade de recarregar todos os resultados em cada página.

Combinando o uso do parâmetro `size` com o `search_after`, é possível percorrer grandes volumes de dados de forma eficiente e com baixo impacto no desempenho da API.

Para paginar os resultados utilizando o `search_after`, é necessário a utilização da ordenação (`sort`) dos dados utilizando o atributo `@timestamp` conforme exemplo abaixo:

```json
{
  "size": 100,
  "query": {
    "bool": {
      "must": [
        {"match": {"classe.codigo": 1116}},
        {"match": {"orgaoJulgador.codigo": 13597}}
      ]
    }
  },
  "sort": [
    {
      "@timestamp": {
        "order": "asc"
      }
    }
  ]
}
```

Após a primeira consulta, a resposta da API incluirá um array chamado `sort` que contém os valores do campo de ordenação para cada documento retornado. Esse array pode ser utilizado como o valor do parâmetro `search_after` na próxima consulta, juntamente com o parâmetro `size` que define a quantidade de documentos a serem retornados na próxima página.

```json
{
  "_index": "api_publica_tjdft",
  "_type": "_doc",
  "_id": "TJDFT_1116_G1_13597_00356079220168070018",
  "_score": null,
  "_source": {},
  "sort": [
    1681366085550
  ]
}
```

Para buscar os próximos 100 processos, basta adicionar o parâmetro `search_after` na próxima consulta, utilizando o valor do campo `sort` do último documento retornado na página anterior conforme exemplo abaixo:

```json
{
  "size": 100,
  "query": {
    "bool": {
      "must": [
        {"match": {"classe.codigo": 1116}},
        {"match": {"orgaoJulgador.codigo": 13597}}
      ]
    }
  },
  "sort": [
    {
      "@timestamp": {
        "order": "asc"
      }
    }
  ],
  "search_after": [
    1681366085550
  ]
}
```

Observe que o valor do campo `search_after` é um array com os valores do campo de ordenação para o último documento retornado na página anterior. É importante lembrar que o `search_after` deve ser utilizado em conjunto com o `sort` e o `size` para garantir uma paginação eficiente dos resultados.

## Glossário de Dados

O glossário de dados da API Pública do Datajud oferece de maneira detalhada os termos, conceitos e estruturas de dados específicos dessa API. A compreensão desse glossário é essencial para otimizar suas consultas, pois ele oferece uma referência sobre como os dados estão organizados e como podem ser acessados. Isso não só agiliza suas pesquisas, mas também garante a precisão e relevância dos resultados obtidos. Portanto, recomendamos enfaticamente a exploração e compreensão do glossário como um passo essencial para aproveitar plenamente os recursos da API.

| Atributo | Tipo | Descrição |
| --- | --- | --- |
| id | text/keyword | Identificador da origem do processo no Datajud - Chave Tribunal_Classe_Grau_OrgaoJulgador_NumeroProcesso |
| tribunal | text/keyword | Identificação do Tribunal pela sigla |
| numeroProcesso | text/keyword | Numeração Única (CNJ) do processo sem formatação |
| dataAjuizamento | datetime | Data de ajuizamento da capa do processo |
| grau | text/keyword | Identificação do instância/grau (G1, G2, JE, etc...) |
| nivelSigilo | long | Nível de sigilo |
| formato | object{} | Identificação de processo Físico ou Eletrônico |
| formato.codigo | long | Código de identificação do formato do processo |
| formato.nome | text/keyword | Identificação se é Físico ou Eletrônico |
| sistema | object{} | Sistema processual de origem do processo no Tribunal |
| sistema.codigo | long | Código do sistema processual |
| sistema.nome | text/keyword | Descrição do sistema processual |
| classe | object{} | Classe Processual conforme TPU |
| classe.codigo | long | Código da classe processual |
| classe.nome | text/keyword | Descrição da classe processual |
| assuntos | array [] | Assuntos do Processo conforme TPU |
| assuntos.codigo | long | Código do assunto |
| assuntos.nome | text/keyword | Descrição do assunto |
| orgaoJulgador | object {} | Órgão Julgador |
| orgaoJulgador.codigo | long | Código da serventia/vara atual do processo |
| orgaoJulgador.nome | text/keyword | Nome da serventia/vara |
| orgaoJulgador.codigoMunicipioIBGE | long | Identificação do município pelo código do IBGE |
| movimentos | array [] | Movimentos Processuais |
| movimentos.codigo | long | Código da movimentação processual conforme TPU |
| movimentos.nome | text/keyword | Descrição da movimentação |
| movimentos.dataHora | datetime | Data e hora da ocorrência de movimentação |
| movimentos.complementosTabelados | array [] | Lista de complementos tabelados daquela movimentação |
| movimentos.complementosTabelados.codigo | long | Código da variável de movimento tabelado |
| movimentos.complementosTabelados.descricao | text/keyword | Descrição da variável do movimento tabelado |
| movimentos.complementosTabelados.valor | long | Código do complemento tabelado |
| movimentos.complementosTabelados.nome | text/keyword | Descrição do complemento tabelado |
| movimentos.orgaoJulgador | object {}** | Órgão julgador do movimento |
| movimentos.orgaoJulgador.codigoOrgao | long | Código da serventia/vara do movimento |
| movimentos.orgaoJulgador.nomeOrgao | text/keyword | Nome da serventia/vara |

### Atributos de Controle Interno

| Atributo | Tipo | Descrição |
| --- | --- | --- |
| dataHoraUltimaAtualizacao | datetime | Milisegundos do atributo millisInsercao da origem do dado |
| @timestamp | datetime | Timestamp da atualização do documento no índice |

## Rotas da API

A API Pública do Datajud oferece várias rotas para pesquisa de informações processuais devido à natureza e organização do Judiciário brasileiro. A url principal de acesso é a `https://api-publica.datajud.cnj.jus.br/` e deverá ser seguida de um alias correspondente ao Tribunal que deseja obter os dados processuais.

**Exemplo:**

O endpoint do Tribunal Regional Federal da 1ª Região é `https://api-publica.datajud.cnj.jus.br/api_publica_trf1/`.

Abaixo segue a relação de tribunais/aliases para pesquisa processual:

### Tribunais Superiores

| Tribunal | URL |
| --- | --- |
| Tribunal Superior do Trabalho | `https://api-publica.datajud.cnj.jus.br/api_publica_tst/_search` |
| Tribunal Superior Eleitoral | `https://api-publica.datajud.cnj.jus.br/api_publica_tse/_search` |
| Tribunal Superior de Justiça | `https://api-publica.datajud.cnj.jus.br/api_publica_stj/_search` |
| Tribunal Superior Militar | `https://api-publica.datajud.cnj.jus.br/api_publica_stm/_search` |

### Justiça Federal

| Tribunal | URL |
| --- | --- |
| Tribunal Regional Federal da 1ª Região | `https://api-publica.datajud.cnj.jus.br/api_publica_trf1/_search` |
| Tribunal Regional Federal da 2ª Região | `https://api-publica.datajud.cnj.jus.br/api_publica_trf2/_search` |
| Tribunal Regional Federal da 3ª Região | `https://api-publica.datajud.cnj.jus.br/api_publica_trf3/_search` |
| Tribunal Regional Federal da 4ª Região | `https://api-publica.datajud.cnj.jus.br/api_publica_trf4/_search` |
| Tribunal Regional Federal da 5ª Região | `https://api-publica.datajud.cnj.jus.br/api_publica_trf5/_search` |
| Tribunal Regional Federal da 6ª Região | `https://api-publica.datajud.cnj.jus.br/api_publica_trf6/_search` |

### Justiça Estadual

| Tribunal | URL |
| --- | --- |
| Tribunal de Justiça do Acre | `https://api-publica.datajud.cnj.jus.br/api_publica_tjac/_search` |
| Tribunal de Justiça de Alagoas | `https://api-publica.datajud.cnj.jus.br/api_publica_tjal/_search` |
| Tribunal de Justiça do Amazonas | `https://api-publica.datajud.cnj.jus.br/api_publica_tjam/_search` |
| Tribunal de Justiça do Amapá | `https://api-publica.datajud.cnj.jus.br/api_publica_tjap/_search` |
| Tribunal de Justiça da Bahia | `https://api-publica.datajud.cnj.jus.br/api_publica_tjba/_search` |
| Tribunal de Justiça do Ceará | `https://api-publica.datajud.cnj.jus.br/api_publica_tjce/_search` |
| TJ do Distrito Federal e Territórios | `https://api-publica.datajud.cnj.jus.br/api_publica_tjdft/_search` |
| Tribunal de Justiça do Espírito Santo | `https://api-publica.datajud.cnj.jus.br/api_publica_tjes/_search` |
| Tribunal de Justiça do Goiás | `https://api-publica.datajud.cnj.jus.br/api_publica_tjgo/_search` |
| Tribunal de Justiça do Maranhão | `https://api-publica.datajud.cnj.jus.br/api_publica_tjma/_search` |
| Tribunal de Justiça de Minas Gerais | `https://api-publica.datajud.cnj.jus.br/api_publica_tjmg/_search` |
| TJ do Mato Grosso de Sul | `https://api-publica.datajud.cnj.jus.br/api_publica_tjms/_search` |
| Tribunal de Justiça do Mato Grosso | `https://api-publica.datajud.cnj.jus.br/api_publica_tjmt/_search` |
| Tribunal de Justiça do Pará | `https://api-publica.datajud.cnj.jus.br/api_publica_tjpa/_search` |
| Tribunal de Justiça da Paraíba | `https://api-publica.datajud.cnj.jus.br/api_publica_tjpb/_search` |
| Tribunal de Justiça de Pernambuco | `https://api-publica.datajud.cnj.jus.br/api_publica_tjpe/_search` |
| Tribunal de Justiça do Piauí | `https://api-publica.datajud.cnj.jus.br/api_publica_tjpi/_search` |
| Tribunal de Justiça do Paraná | `https://api-publica.datajud.cnj.jus.br/api_publica_tjpr/_search` |


