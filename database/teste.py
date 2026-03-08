import control

con = control.Controller()

#con.inserir_clientes('Daniel', '68 99958 7462', 'Acre', 'Rio Branco', 500)
#con.inserir_clientes('Fulano', '99 99999 9999', 'Amazonas', 'Manaus', 700)
#con.inserir_orcamento(1, 'Pendente', 'Monofásico', 'Cerâmico', 'DMEGC', 'DMEGC610WP',
#                      610, 35, 'PHB 6000', 'PHP', 6, 10, 'NULL', 'NULL', 'NULL', 'NULL')

#con.inserir_orcamento(1, 'Pendente', 'Bifásico', 'Cerâmico', 'DMEGC', 'DMEGC610WP',
#                      720, 90, 'PHB 6000', 'PHP', 6, 10, 'NULL', 'NULL', 'NULL', 'NULL')

#con.editar_cliente(1, ?)
#print(con.listar_info_cliente(1))
#print(con.consultar_orcamento(2))
#print(con.consultar_orcamento_por_cliente())
#print(con.listar_orcamentos())


con.editar_orcamento(1, 'Aprovado', 'Trifásico', 'Cerâmico', 'DMEGC', 'DMEGC610WP',
                      610, 35, 'PHB 6000', 'PHP', 6, 10, 'PHB 7000', 'NULL', 'NULL', 'NULL')
#con.editar_orcamento(1, *coisa)

print(con.consultar_orcamento(1))