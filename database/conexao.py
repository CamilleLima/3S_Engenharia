import sqlite3
from sqlite3 import Error
import sys
import os

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
                
                insert into config
                values (4.5, 2000, 0.95, 550, 2.5, 80, 4.5, 'Thales Campos', '68 9973 3807');
            """)

            # Cria a tabela de orcamentos se não existir (ainda incompleto)
            # Esta tabela armazena as informações de cada orçamento, para fins de serem
            # consultadas e aparecerem na lista de orçamentos do sistema.
            cursor.execute("""
                create table if not exists orcamentos (
                    id integer not null primary key autoincrement,
                    cliente varchar not null,
                    telefone char(11) not null,
                    cidade varchar not null,
                    
                    con_med int not null,
                    tipo_lig varchar not null,
                    tipo_tel varchar not null,
                    
                    mod varchar not null,
                    fabr_mod varchar not null,
                    pot_mod int not null,
                    peso_mod float not null,
                    inv1 varchar not null,
                    fabr_inv1 varchar not null,
                    pot_inv1 int not null,
                    gar_inv1 int not null,
                    inv2 varchar null,
                    fabr_inv2 varchar null,
                    pot_inv2 varchar null,
                    gar_inv2 null
                );
            """)
            
            return con
        except Error as er:
            print((er))