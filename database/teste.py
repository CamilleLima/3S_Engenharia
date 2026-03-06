import control

con = control.Controller()
con.inserir_clientes('Gesonel', '68 99958 7462', 'Rio Branco')
print(con.listar_info_cliente(1))