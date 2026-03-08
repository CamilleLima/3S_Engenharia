import sqlite3
from sqlite3 import Error

class Conexao:
    #Conecta o BD
    #Cria as tabelas caso o arquivo do BD não exista ainda
    def get_conexao(self):
        caminho = 'solarpro.db'
        try:
            con = sqlite3.connect(caminho)
            cursor = con.cursor()
            
            # Cria a tabela config se não existir
            # Essa tabela armazena as configurações do sistema.
            cursor.execute("""
                create table if not exists config (
                    pre_kit float not null,
                    cust_inst float not null,
                    tar_eng float not null,
                    pot_pnl int not null,
                    area_pnl float not null,
                    efi_sist int not null,
                    irr_sol float not null,
                    
                    resp_nome varchar not null,
                    resp_cont varchar not null
                );
            """)
            
            # Preenche com os valores padrão
            cursor.execute("""
                insert into config
                select 4.5, 2000, 0.95, 550, 2.5, 80, 4.5, 'Thales Campos', '68 9973 3807'
                where not exists (select 1 from config);
            """)
            
            # Cria a tabela clientes se não existir
            # Armazena as informações dos clientes
            cursor.execute("""
                    create table if not exists clientes (
                        id integer not null primary key autoincrement,
                        nome varchar not null,
                        telefone char(11) not null,
                        estado varchar not null,
                        cidade varchar not null,
                        consumo_medio not null
                        );
                    """)

            # Cria a tabela de orcamentos se não existir
            # Esta tabela armazena as informações de cada orçamento, para fins de serem
            # consultadas e aparecerem na lista de orçamentos do sistema.
            # O status é ou pendente, ou aceito ou recusado.
            cursor.execute("""
                create table if not exists orcamentos (
                    id integer not null primary key autoincrement,
                    cliente_id integer not null,
                    status varchar not null,
                    
                    tipo_ligacao varchar not null,
                    tipo_telhado varchar not null,
                    
                    modelo_modulo varchar not null,
                    fabricante_modulo varchar not null,
                    potencia_modulo int not null,
                    peso_modulo float not null,
                    inversor1 varchar not null,
                    fabricante_inversor1 varchar not null,
                    potencia_inversor1 int not null,
                    garantia_inversor1 int not null,
                    
                    inversor2 varchar null,
                    fabricante_inversor2 varchar null,
                    potencia_inversor2 int null,
                    garantia_inversor2 int null,
                    
                    foreign key (cliente_id) references clientes (id)
                );
            """)
            
            con.commit()
            
            return con
        except Error as er:
            print((er))