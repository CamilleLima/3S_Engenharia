import model

class Controller:
    def __init__(self):
        self.model = model.Model()

    def inserir_clientes(self, nome, telefone, cidade):
        sql = (f"INSERT INTO clientes VALUES(NULL, '{nome}', '{telefone}','{cidade}');")
        return self.model.insert(sql)
    
    def inserir_orcamento(self, cliente_id, *valores):
        coisinhas = ', '.join([f"'{i}'" if i.isalpha() else i for i in list(valores)])
        
        sql = (f"INSERT INTO orcamentos VALUES (NULL, {cliente_id}, {coisinhas})")
        return self.model.insert(sql)

    def listar_info_cliente(self, cliente_id):
        sql = f"SELECT * FROM clientes WHERE id={cliente_id};"
        return self.model.get(sql)
    
    def listar_orcamentos(self):
        sql = f"SELECT * FROM orcamentos;"
        return self.model.get(sql)

    def excluir_clientes(self, cliente_id):
        sql = f"DELETE FROM clientes WHERE id={cliente_id};"
        return self.model.delete(sql)
    
    def editar_clientes(self, cliente_id, nome, cpf, email):
        sql = f"UPDATE clientes SET nome={nome}, cpf={cpf}, email={email} WHERE id={cliente_id};"
        return self.model.update(sql)
    
    def editar_orcamento(self, cliente_id, **campos):
        coisinhas = ', '.join([f"{chave}=?" for chave in campos.keys()])
        
        sql = (f"UPDATE orcamentos SET {coisinhas}) WHERE cliente_id={cliente_id}")
        return self.model.update(sql, list(campos.values()))