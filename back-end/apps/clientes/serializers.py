"""
Serializers para o app clientes.
"""

from rest_framework import serializers

from .models import Cliente, Vendedor
from .services import buscar_endereco_por_cep


class VendedorSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Vendedor."""

    class Meta:
        model = Vendedor
        fields = [
            "id",
            "nome",
            "cargo",
            "telefone",
            "email",
            "ativo",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_telefone(self, value):
        """Valida que o telefone contém apenas números."""
        if not value.isdigit():
            raise serializers.ValidationError(
                "Telefone deve conter apenas números."
            )
        return value


class ClienteSerializer(serializers.ModelSerializer):
    """
    Serializer para o modelo Cliente.
    Integra com o service de CEP para buscar endereço automaticamente.
    """

    # Campo read-only para retornar endereço completo formatado
    endereco_completo = serializers.ReadOnlyField()

    # Campos opcionais de endereço que serão preenchidos automaticamente
    rua = serializers.CharField(required=False, allow_blank=True)
    bairro = serializers.CharField(required=False, allow_blank=True)
    cidade = serializers.CharField(required=False, allow_blank=True)
    estado = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Cliente
        fields = [
            "id",
            "nome",
            "cpf",
            "telefone",
            "email",
            "cep",
            "rua",
            "bairro",
            "cidade",
            "estado",
            "numero",
            "endereco_completo",
            "consumo_kwh_mes",
            "tipo_ligacao",
            "tipo_telhado",
            "vendedor",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "endereco_completo"]

    def validate_cpf(self, value):
        """Valida que o CPF contém apenas números."""
        if not value.isdigit():
            raise serializers.ValidationError(
                "CPF deve conter apenas números."
            )
        if len(value) != 11:
            raise serializers.ValidationError("CPF deve conter 11 dígitos.")
        return value

    def validate_telefone(self, value):
        """Valida que o telefone contém apenas números (se fornecido)."""
        if value and not value.isdigit():
            raise serializers.ValidationError(
                "Telefone deve conter apenas números."
            )
        return value

    def validate_cep(self, value):
        """Valida que o CEP contém apenas números."""
        if not value.isdigit():
            raise serializers.ValidationError(
                "CEP deve conter apenas números."
            )
        if len(value) != 8:
            raise serializers.ValidationError("CEP deve conter 8 dígitos.")
        return value

    def create(self, validated_data):
        """
        Sobrescreve create para buscar endereço via CEP automaticamente.
        """
        cep = validated_data.get("cep")

        # Busca endereço via ViaCEP
        endereco = buscar_endereco_por_cep(cep)

        # Sobrescreve os campos de endereço com os dados da API
        # (exceto se o usuário forneceu explicitamente)
        validated_data.setdefault("rua", endereco["rua"])
        validated_data.setdefault("bairro", endereco["bairro"])
        validated_data.setdefault("cidade", endereco["cidade"])
        validated_data.setdefault("estado", endereco["estado"])

        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        Sobrescreve update para buscar endereço via CEP se o CEP foi alterado.
        """
        cep = validated_data.get("cep", instance.cep)

        # Se o CEP foi alterado, busca novo endereço
        if cep != instance.cep:
            endereco = buscar_endereco_por_cep(cep)

            # Atualiza os campos de endereço com os dados da API
            # (exceto se o usuário forneceu explicitamente)
            validated_data.setdefault("rua", endereco["rua"])
            validated_data.setdefault("bairro", endereco["bairro"])
            validated_data.setdefault("cidade", endereco["cidade"])
            validated_data.setdefault("estado", endereco["estado"])

        return super().update(instance, validated_data)


class ClienteCreateSerializer(ClienteSerializer):
    """
    Serializer específico para criação de clientes.
    Exibe informações do vendedor de forma expandida.
    """

    vendedor_detalhes = VendedorSerializer(source="vendedor", read_only=True)

    class Meta(ClienteSerializer.Meta):
        fields = ClienteSerializer.Meta.fields + ["vendedor_detalhes"]

