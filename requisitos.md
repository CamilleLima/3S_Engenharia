# Documento de Requisitos de Software

**Cliente:** 3S Engenharia

**Versão:** 1.1

**Local e Ano:** Rio Branco – AC, 2026

## Desenvolvedores / Analistas

* Camille Vitória Chaves de Lima
* Daniel Gomes Chaves
* Maria Luiza Oliveira de Souza
* Paulo Ricardo Steiner Fernandes Horlando
* William Nascimento

---

## Histórico de Alterações

| Data | Versão | Descrição | Autor |
| --- | --- | --- | --- |
| 25/01/2026 | 1.0 | Preenchimento inicial do documento | Camille Lima |
| 01/02/2026 | 1.1 | Preenchimento dos Campos: Estudo de Viabilidade, Limites, Benefícios e Restrições do Software; Adição de detalhes em Requisitos Funcionais. | Camille Lima |

---

## 1. Análise do Problema

O processo atual de elaboração de propostas comerciais na 3S Engenharia é dependente de planilhas eletrônicas descentralizadas, o que acarreta riscos significativos à integridade dos dados devido à manipulação manual de fórmulas complexas de dimensionamento e precificação. Isso resulta em erros de cálculo (arredondamentos e falhas humanas) e falta de padronização visual nos documentos entregues.

## 2. Necessidades Básicas do Cliente

A 3S Engenharia necessita de um sistema de software web que centralize e automatize a engenharia de vendas, permitindo que os vendedores insiram dados de consumo e localização para que a aplicação realize automaticamente o dimensionamento técnico (seleção de inversores e painéis) e financeiro (retorno de investimento). O fluxo deve ser finalizado com a geração imediata de uma proposta comercial em formato PDF padronizado, garantindo a segurança das regras de negócio e a eliminação de erros operacionais no atendimento ao cliente.

## 3. Estudo de Viabilidade

O estudo de viabilidade para o sistema de automação da 3S Engenharia analisa a convergência entre os requisitos operacionais e as possibilidades reais de implementação, garantindo que o projeto seja sustentável e seguro. Esta análise divide-se nos pilares técnico, econômico e legal, fornecendo a fundamentação necessária para o início do desenvolvimento.

### 3.1. Viabilidade Técnica

A implementação do sistema fundamenta-se em uma arquitetura moderna e escalável, utilizando Python com o framework Django no backend, o que garante uma gestão robusta de regras de negócio complexas e uma camada de persistência segura via PostgreSQL. A escolha do Django permite a criação de uma API estruturada para o motor de cálculo fotovoltaico, enquanto o React, integrado ao Tailwind, possibilitará o desenvolvimento de uma interface reativa e de alta performance. Isso é essencial para a manipulação dinâmica de dados de consumo por comunidades globais e bibliotecas maduras, assegurando que a automação do dimensionamento e a geração de documentos PDF sejam executadas com baixa latência e alta disponibilidade, sem gargalos técnicos previstos.

### 3.2. Viabilidade Econômica

Sob a perspectiva financeira, o projeto apresenta um balanço favorável entre o custo de desenvolvimento e o retorno sobre o investimento (ROI). A economia principal advém da drástica redução de *man-hour* (horas-homem) dedicado à elaboração manual de propostas e da eliminação de prejuízos causados por erros de precificação e arredondamentos inconsistentes. A centralização do fluxo comercial permite um aumento no volume de atendimentos sem a necessidade de expansão proporcional da equipe técnica. Assim, a mitigação de falhas operacionais e o ganho de agilidade na entrega dos orçamentos conferem à 3S Engenharia uma vantagem competitiva que justifica o aporte de capital para a digitalização do processo.

### 3.3. Viabilidade Legal

No âmbito legal, o software será desenvolvido em conformidade com a Lei Geral de Proteção de Dados (LGPD), assegurando o tratamento sigiloso das informações de consumo e dados cadastrais dos clientes finais por meio de criptografia e controles de acesso rigorosos. Adicionalmente, o sistema respeitará as normas técnicas vigentes e as diretrizes regulatórias do setor de energia solar, garantindo que os dimensionamentos técnicos sigam os padrões de engenharia exigidos. A automação do fluxo de propostas também confere maior segurança jurídica à empresa, uma vez que padroniza as cláusulas comerciais e os termos de serviço apresentados, reduzindo vulnerabilidades em eventuais auditorias e litígios.

## 4. Missão do Software

A missão do software é otimizar e profissionalizar o fluxo comercial da 3S Engenharia, substituindo processos manuais propensos a falhas por uma solução web automatizada que garante precisão no dimensionamento de projetos fotovoltaicos e agilidade na geração de propostas, proporcionando maior segurança operacional e competitividade no atendimento ao cliente final.

---

## 5. Limites do Sistema

| ID | Funcionalidade | Justificativa |
| --- | --- | --- |
| **L1** | Dependência de Dados de Terceiros | A precisão dos resultados está condicionada à acurácia das bases de dados externas de irradiância (como NASA ou CRESESB) e à atualização manual das tabelas de tarifas das concessionárias. |

## 6. Benefícios Gerais

| ID | Benefício |
| --- | --- |
| **B1** | Eficiência Operacional |
| **B2** | Segurança e Integridade |
| **B3** | Escalabilidade e Conversão |
| **B4** | *(A definir)* |
| **B5** | *(A definir)* |

## 7. Restrições

| ID | Restrição | Descrição |
| --- | --- | --- |
| **R1** | Conectividade | Como uma aplicação Web baseada na stack Python/React, o sistema depende exclusivamente de acesso à internet, não prevendo funcionamento em modo offline em áreas rurais sem sinal. |
| **R2** | *(A definir)* | *(A definir)* |

## 8. Atores

| ID | Atores | Descrição |
| --- | --- | --- |
| **A1** | Vendedor | Responsável pelo cadastro de clientes e inserção de dados para a geração de propostas. |

---

## 9. Requisitos Funcionais

| ID | Funcionalidade | Necessidades | Classificação |
| --- | --- | --- | --- |
| **RF1** | Formulário de Entrada de Dados | O sistema deve apresentar uma interface única (ou passo-a-passo) para o vendedor inserir dados dos clientes (Nome, CPF, CEP, Bairro, Rua, Número da Residência e KWh/mês contido na Conta de Energia) e dados do próprio vendedor (Nome, Cargo). | Alta |
| **RF2** | Realizar Dimensionamento do Sistema Fotovoltaico | O sistema deve calcular a potência necessária e definir o kit solar (quantidade de placas e inversor; a escolha da marca dos produtos será de responsabilidade do vendedor) com base no consumo e na irradiação local (Residência do cliente informada no cadastro). | Alta |
| **RF3** | Calcular Retorno de Investimento (Payback) | Com base no dimensionamento gerado, o sistema deve calcular a economia mensal estimada em Reais e o tempo de retorno do investimento (Payback). | Alta |
| **RF4** | Geração de Relatório | Documento editável com todas as informações já inseridas (Dados de cadastro e cálculos de Dimensionamento e Retorno de Investimento) para a revisão final do vendedor. | Alta |
| **RF5** | Geração de Orçamento (Documento Final) | Documento (em formato PDF) a ser enviado para o cliente. | Alta |
| **RF6** | *(A definir)* | *(A definir)* | *(A definir)* |
| **RF7** | *(A definir)* | *(A definir)* | *(A definir)* |
| **RF8** | *(A definir)* | *(A definir)* | *(A definir)* |
| **RF9** | *(A definir)* | *(A definir)* | *(A definir)* |

## 10. Requisitos Não-Funcionais

| ID | Requisitos | Categoria | Classificação |
| --- | --- | --- | --- |
| **NRF1** | Disponibilidade | *(A definir)* | Alta |
| **NRF2** | Privacidade dos Dados (LGPD) | *(A definir)* | Alta |
| **NRF3** | Confiabilidade | *(A definir)* | Alta |

---

## 11. Requisitos de Hardware

### 11.1. Configuração Mínima

* **Cliente (Usuário):** Processador Dual-Core 2.0 GHz, 4GB de RAM, resolução de tela de 1024x768 e navegador moderno (Chrome 90+, Firefox 88+ ou Edge) com suporte a JavaScript/ES6.
* **Servidor (Hospedagem):** Instância de entrada (VPS) com 1 vCPU, 1GB de RAM e 10GB de armazenamento SSD (Ex: AWS t3.micro ou similar).

### 11.2. Configuração Recomendada

* **Cliente (Usuário):** Processador Quad-Core 2.5 GHz ou superior, 8GB de RAM, conexão de internet estável (5 Mbps+) e monitor Full HD (1920x1080) para melhor visualização do Dashboard e PDFs.
* **Servidor (Hospedagem):** Instância com 2 vCPUs, 2GB de RAM e 20GB de armazenamento SSD com rotinas de backup automatizado para o banco de dados PostgreSQL.

---

## 12. Ferramentas de Desenvolvimento e Licença de Uso

* **Ambiente de Desenvolvimento:** Visual Studio Code (IDE), Git (controle de versão).
* **Stack Tecnológica:** Linguagem Python 3.10+, Framework Django (Backend), Biblioteca React com Tailwind CSS (Frontend) e Banco de Dados PostgreSQL.
* **Licenciamento das Ferramentas:** A stack escolhida é composta integralmente por tecnologias Open-Source (Licenças MIT, BSD e PostgreSQL License), o que elimina custos de licenciamento de terceiros para o desenvolvimento.
