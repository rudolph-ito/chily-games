module VariantMessages

  def setup_message
    msgs = ["Please place #{number_of_pieces} pieces."]
    msgs += piece_rules.map do |pr|
      count = pr.count
      name = pr.piece_type.name.downcase
      name = name.pluralize if count != '1'
      "#{count} #{name}"
    end
    msgs.join("\n")
  end

end
