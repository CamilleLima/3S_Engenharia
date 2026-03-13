import model

class Controller:
    def __init__(self):
        self.model = model.Model()

    def inserir_clientes(self, *valores):
        coisinhas = ', '.join([f"'{i}'" for i in list(valores)])
        sql = (f"INSERT INTO clientes VALUES(NULL, {coisinhas});")
        return self.model.insert(sql)
    
    def inserir_orcamento(self, cliente_id, *valores):
        coisinhas = ', '.join([f"'{i}'" for i in list(valores)])
        
        sql = (f"INSERT INTO orcamentos VALUES (NULL, {cliente_id}, {coisinhas})")
        return self.model.insert(sql)

    def listar_info_cliente(self, cliente_id):
        sql = f"SELECT * FROM clientes WHERE id={cliente_id};"
        return self.model.get(sql)
    
    def listar_orcamentos(self):
        sql = f"SELECT * FROM orcamentos;"
        return self.model.get(sql)
    
    def listar_orcamentos_por_cliente(self, cliente_id):
        sql = f"SELECT * FROM orcamentos WHERE cliente_id = {cliente_id}"
        return self.model.get(sql)
    
    def consultar_orcamento(self, orcamento_id):
        sql = f"SELECT * FROM orcamentos WHERE id = {orcamento_id}"
        return self.model.get(sql)

    def excluir_cliente(self, cliente_id):
        sql = f"DELETE FROM clientes WHERE id={cliente_id};"
        return self.model.delete(sql)
    
    def editar_cliente(self, cliente_id, *valores):
        tabela = self.model.get('PRAGMA table_info(clientes)')
        colunas = [coluna[1] for coluna in tabela]
        nomes = colunas[2:]
        coisinhas = ', '.join([f"{nomes[i]}='{valores[i]}'" for i in range(0, len(valores))])
        sql = f"UPDATE clientes SET {coisinhas} WHERE id={cliente_id}"
        return self.model.update(sql)
    
    def editar_orcamento(self, orcamento_id, *valores):
        tabela = self.model.get('PRAGMA table_info(orcamentos)')
        colunas = [coluna[1] for coluna in tabela]
        nomes = colunas[2:]
        coisinhas = ', '.join([f"{nomes[i]}='{valores[i]}'" if valores[i] != 'NULL' else f"{nomes[i]}={valores[i]}" for i in range(0, len(valores))])
        
        sql = (f"UPDATE orcamentos SET {coisinhas} WHERE id={orcamento_id};")
        return self.model.update(sql)