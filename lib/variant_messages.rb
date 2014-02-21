module VariantMessages

  def setup_message
    msgs = ["Please place the following pieces:"]
    msgs += piece_rules.map do |pr|
      pr.count_with_name
    end

    if terrain_rules.count > 0
      msgs << "Please place the following terrain:"
      msgs += terrain_rules.map do |tr|
        tr.count_with_name
      end
    end

    msgs.join("\n")
  end

end
