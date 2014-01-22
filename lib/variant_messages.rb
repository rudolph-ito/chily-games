module VariantMessages

  def setup_message
    msgs = ["Please place #{number_of_pieces} pieces."]
    msgs += piece_rules.map do |pr|
      pr.count_with_name
    end
    msgs.join("\n")
  end

end
